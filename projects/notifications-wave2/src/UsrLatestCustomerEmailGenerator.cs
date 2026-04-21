namespace BPMSoft.Configuration
{
	using System;
	using System.Collections.Generic;
	using BPMSoft.Common;
	using BPMSoft.Core;
	using BPMSoft.Core.Entities;

	#region Class: UsrLatestCustomerEmailGenerator

	/// <summary>
	/// Пользовательский макрос для шаблонов email-уведомлений.
	/// Возвращает тело письма (Body) конкретной активности — входящего письма клиента.
	/// Регистрируется в EmailTemplateMacros с ParentId = @Invoke.
	/// Вызов в шаблоне: #@Invoke.UsrLatestCustomerEmailGenerator#
	/// </summary>
	public class UsrLatestCustomerEmailGenerator : IMacrosInvokable
	{

		#region Properties: Public

		public UserConnection UserConnection { get; set; }

		#endregion

		#region Methods: Private

		// Извлекает Id активности из аргументов макроса (передаётся движком шаблонов)
		private Guid GetActivityId(object argument) {
			var recordArgument = argument as KeyValuePair<string, Guid>?;
			return recordArgument.HasValue ? recordArgument.Value.Value : Guid.Empty;
		}

		#endregion

		#region Methods: Public

		// Возвращает тело письма активности — подставляется в место вызова макроса в шаблоне
		public string GetMacrosValue(object arguments) {
			Guid activityId = GetActivityId(arguments);
			if (activityId == Guid.Empty) {
				return string.Empty;
			}
			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Activity");
			esq.AddColumn("Body");
			var activity = esq.GetEntity(UserConnection, activityId);
			if (activity == null) {
				return string.Empty;
			}
			return activity.GetTypedColumnValue<string>("Body");
		}

		#endregion

	}

	#endregion
}
