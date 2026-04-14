# Не прерывать выполнение на нефатальных ошибках, а продолжать и логировать
$ErrorActionPreference = 'Continue'

# Каталог для логов
$LogDir  = 'C:\WireGuard\Logs'

# Файл лога для скрипта поднятия туннеля
$LogFile = Join-Path $LogDir 'wg-routes-up.log'

# Шлюз WireGuard, который нужно исключить при поиске локального default gateway
$wgGateway = '192.168.2.1'

# Создаем каталог логов, если его еще нет
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

# Функция записи строки в лог-файл с отметкой времени
function Write-Log {
    param([string]$Message)

    # Время в удобном формате
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

    # Добавляем строку в лог
    "[{0}] {1}" -f $ts, $Message | Out-File -FilePath $LogFile -Append -Encoding utf8
}

# Отмечаем начало работы скрипта
Write-Log '=== START UP SCRIPT ==='

try {
    # Получаем все default routes IPv4
    # и исключаем маршрут через WireGuard-шлюз
    $defaultRoutes = Get-NetRoute -DestinationPrefix '0.0.0.0/0' |
        Where-Object { $_.NextHop -ne $wgGateway } |
        Sort-Object RouteMetric, ifMetric

    # Пишем в лог, сколько подходящих default route найдено
    Write-Log "Default routes found: $($defaultRoutes.Count)"

    # Берем лучший из оставшихся маршрутов и извлекаем его шлюз
    $gw = ($defaultRoutes | Select-Object -First 1).NextHop

    # Если локальный шлюз не найден — завершаем работу
    if (-not $gw) {
        Write-Log 'ERROR: Не найден локальный шлюз'
        exit 1
    }

    # Пишем в лог выбранный локальный шлюз
    Write-Log "Gateway: $gw"

    # Список маршрутов, которые должны идти МИМО VPN
    $routeList = @(
        @{ Dest = '172.18.210.4'; Mask = '255.255.255.255' }, # локальный DNS 1
        @{ Dest = '172.18.210.5'; Mask = '255.255.255.255' }, # локальный DNS 2
        @{ Dest = '89.175.77.1';   Mask = '255.255.255.255' }, # отдельный внешний адрес в обход VPN
        @{ Dest = '172.16.0.0';    Mask = '255.240.0.0' },     # локальная сеть 172.16.0.0/12
        @{ Dest = '10.1.0.0';      Mask = '255.255.0.0' },     # локальная сеть 10.1.0.0/16
        @{ Dest = '10.0.3.0';      Mask = '255.255.255.0' },   # локальная сеть 10.0.3.0/24
        @{ Dest = '192.168.55.0';  Mask = '255.255.255.0' },   # локальная сеть 192.168.55.0/24
        @{ Dest = '192.168.102.0'; Mask = '255.255.255.0' }    # локальная сеть 192.168.102.0/24
    )

    # Добавляем каждый маршрут через найденный локальный шлюз
    foreach ($route in $routeList) {
        # Логируем, какой маршрут сейчас добавляем
        Write-Log "Adding route: $($route.Dest) mask $($route.Mask) via $gw"

        # Добавляем маршрут в таблицу маршрутизации Windows
        # Без -p, чтобы он не оставался после отключения туннеля
        $output = & route.exe add $route.Dest mask $route.Mask $gw 2>&1

        # Если route.exe что-то вывел — сохраняем это в лог
        if ($output) {
            Write-Log ($output | Out-String)
        }

        # Пишем код возврата route.exe
        Write-Log "Route add exit code: $LASTEXITCODE"
    }

    # Начинаем очистку старых NRPT-правил
    Write-Log 'Removing old NRPT rules'

    # Удаляем старые DNS-правила для нужных зон,
    # чтобы не плодить дубликаты при повторном запуске
    Get-DnsClientNrptRule |
        Where-Object {
            $_.Namespace -in @(
                '.synology.me',
                '.chucity.keenetic.link',
                '.local',
                '.home',
                '.cti.ru',
                '.'
            )
        } |
        ForEach-Object {
            # Логируем удаляемую DNS-зону
            Write-Log "Removing NRPT rule: $($_.Namespace)"

            # Удаляем найденное правило
            $_ | Remove-DnsClientNrptRule -Force -Confirm:$false
        }

    # Начинаем добавление новых NRPT-правил
    Write-Log 'Adding NRPT rules'

    # Все запросы к *.synology.me отправлять на DNS 10.77.11.1
    Add-DnsClientNrptRule -Namespace '.synology.me' -NameServers '10.77.11.1'
    Write-Log 'Added NRPT: .synology.me -> 10.77.11.1'

    # Все запросы к *.myown.keenetic.link отправлять на DNS 10.77.11.1
    Add-DnsClientNrptRule -Namespace '.myown.keenetic.link' -NameServers '10.77.11.1'
    Write-Log 'Added NRPT: .myown.keenetic.link -> 10.77.11.1'

    # Все запросы к *.local отправлять на DNS 10.77.11.1
    Add-DnsClientNrptRule -Namespace '.local' -NameServers '10.77.11.1'
    Write-Log 'Added NRPT: .local -> 10.77.11.1'

    # Все запросы к *.home отправлять на DNS 10.77.11.1
    Add-DnsClientNrptRule -Namespace '.home' -NameServers '10.77.11.1'
    Write-Log 'Added NRPT: .home -> 10.77.11.1'

    # При необходимости можно включить отдельное правило для cti.ru
    # Add-DnsClientNrptRule -Namespace '.cti.ru' -NameServers '172.18.210.4'

    # При необходимости можно включить дефолтное DNS-правило для всех запросов
    # Add-DnsClientNrptRule -Namespace '.' -NameServers '10.77.11.1'

    # Очищаем DNS-кеш Windows, чтобы новые правила начали применяться сразу
    Write-Log 'Flushing DNS cache'
    ipconfig /flushdns | Out-Null

    # Отмечаем успешное завершение
    Write-Log '=== END UP SCRIPT ==='
    exit 0
}
catch {
    # Логируем текст ошибки
    Write-Log "FATAL ERROR: $($_.Exception.Message)"

    # Логируем стек PowerShell для диагностики
    Write-Log $_.ScriptStackTrace

    # Завершаем с ошибкой
    exit 1
}
