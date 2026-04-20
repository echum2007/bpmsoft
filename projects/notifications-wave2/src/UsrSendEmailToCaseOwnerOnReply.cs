namespace BPMSoft.Configuration
{
	using global::Common.Logging;
	using System;
	using System.Collections.Generic;
	using BPMSoft.Common;
	using BPMSoft.Core;
	using BPMSoft.Core.Entities;
	using SystemSettings = BPMSoft.Core.Configuration.SysSettings;

	#region Class: UsrSendEmailToCaseOwnerOnReply

	/// <summary>
	/// Sends email notification to case owner and configured roles when a customer reply is received.
	/// </summary>
	public class UsrSendEmailToCaseOwnerOnReply
	{

		#region Constants: Private

		private static readonly ILog _log = LogManager.GetLogger("CaseNotification");

		// RecipientType lookup values — must match UsrEmployeeNotificationRecipientType data
		private const string RecipientTypeOwner = "Owner";
		private const string RecipientTypeGroup = "Group";
		private const string RecipientTypeRole = "Role";

		// EventType lookup value — must match UsrEmployeeNotificationEventType data
		private const string EventTypeCustomerReply = "CustomerReply";

		#endregion

		#region Properties: Public

		public UserConnection UserConnection { get; private set; }

		public Guid ActivityId { get; set; }

		private EmailWithMacrosManager _emailWithMacrosManager;
		public EmailWithMacrosManager EmailWithMacrosManager {
			get => _emailWithMacrosManager ?? (_emailWithMacrosManager = new EmailWithMacrosManager(UserConnection));
			set => _emailWithMacrosManager = value;
		}

		#endregion

		#region Constructors: Public

		public UsrSendEmailToCaseOwnerOnReply(UserConnection userConnection) {
			UserConnection = userConnection;
		}

		#endregion

		#region Methods: Private

		private Guid GetCaseIdByActivity(Guid activityId) {
			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Activity");
			string caseIdColName = esq.AddColumn("Case.Id").Name;
			var activity = esq.GetEntity(UserConnection, activityId);
			return activity == null ? Guid.Empty : activity.GetTypedColumnValue<Guid>(caseIdColName);
		}

		private string _ownerIdCol;
		private string _ownerEmailCol;
		private string _statusIdCol;
		private string _categoryIdCol;
		private string _groupIdCol;

		private Entity LoadCase(Guid caseId) {
			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "Case");
			_ownerIdCol = esq.AddColumn("Owner.Id").Name;
			_ownerEmailCol = esq.AddColumn("Owner.Email").Name;
			_statusIdCol = esq.AddColumn("Status.Id").Name;
			_categoryIdCol = esq.AddColumn("Category.Id").Name;
			_groupIdCol = esq.AddColumn("SupportGroup.Id").Name;
			return esq.GetEntity(UserConnection, caseId);
		}

		private string _ruleTemplateIdCol;
		private string _ruleRecipientTypeNameCol;
		private string _ruleRoleIdCol;

		private EntityCollection GetRules(Guid statusId, Guid categoryId) {
			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "UsrEmployeeNotificationRule");
			_ruleTemplateIdCol = esq.AddColumn("EmailTemplate.Id").Name;
			_ruleRecipientTypeNameCol = esq.AddColumn("UsrRecipientType.Name").Name;
			_ruleRoleIdCol = esq.AddColumn("Role.Id").Name;
			esq.AddColumn("SupportGroup.Id");

			var activeFilter = esq.CreateFilterWithParameters(FilterComparisonType.Equal, "IsActive", true);
			esq.Filters.Add(activeFilter);

			// EventType = CustomerReply OR NULL
			var eventTypeFilter = esq.CreateFilterWithParameters(FilterComparisonType.Equal,
				"UsrEventType.Name", EventTypeCustomerReply);
			var eventTypeNullFilter = esq.CreateIsNullFilter("UsrEventType");
			var eventTypeGroup = new EntitySchemaQueryFilterCollection(esq, LogicalOperationStrict.Or);
			eventTypeGroup.Add(eventTypeFilter);
			eventTypeGroup.Add(eventTypeNullFilter);
			esq.Filters.Add(eventTypeGroup);

			// Status = current OR NULL
			if (statusId != Guid.Empty) {
				var statusFilter = esq.CreateFilterWithParameters(FilterComparisonType.Equal, "CaseStatus", statusId);
				var statusNullFilter = esq.CreateIsNullFilter("CaseStatus");
				var statusGroup = new EntitySchemaQueryFilterCollection(esq, LogicalOperationStrict.Or);
				statusGroup.Add(statusFilter);
				statusGroup.Add(statusNullFilter);
				esq.Filters.Add(statusGroup);
			}

			// Category = current OR NULL
			if (categoryId != Guid.Empty) {
				var categoryFilter = esq.CreateFilterWithParameters(FilterComparisonType.Equal, "CaseCategory", categoryId);
				var categoryNullFilter = esq.CreateIsNullFilter("CaseCategory");
				var categoryGroup = new EntitySchemaQueryFilterCollection(esq, LogicalOperationStrict.Or);
				categoryGroup.Add(categoryFilter);
				categoryGroup.Add(categoryNullFilter);
				esq.Filters.Add(categoryGroup);
			}

			return esq.GetEntityCollection(UserConnection);
		}

		private List<string> GetRoleEmails(Guid roleId) {
			var emails = new List<string>();
			if (roleId == Guid.Empty) return emails;

			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "SysUserInRole");
			string emailCol = esq.AddColumn("SysUser.Contact.Email").Name;
			esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "SysRole", roleId));
			var collection = esq.GetEntityCollection(UserConnection);
			foreach (var item in collection) {
				var email = item.GetTypedColumnValue<string>(emailCol);
				if (!email.IsNullOrEmpty()) {
					emails.Add(email);
				}
			}
			return emails;
		}

		private List<string> GetGroupEmails(Guid groupId) {
			var emails = new List<string>();
			if (groupId == Guid.Empty) return emails;

			var esq = new EntitySchemaQuery(UserConnection.EntitySchemaManager, "SysUserInRole");
			string emailCol = esq.AddColumn("SysUser.Contact.Email").Name;
			esq.Filters.Add(esq.CreateFilterWithParameters(FilterComparisonType.Equal, "SysRole", groupId));
			var collection = esq.GetEntityCollection(UserConnection);
			foreach (var item in collection) {
				var email = item.GetTypedColumnValue<string>(emailCol);
				if (!email.IsNullOrEmpty()) {
					emails.Add(email);
				}
			}
			return emails;
		}

		private void SendToRecipient(Guid caseId, Guid templateId, string recipientEmail) {
			if (recipientEmail.IsNullOrEmpty()) return;
			string sender = SystemSettings.GetValue(UserConnection, "SupportServiceEmail", string.Empty);
			try {
				EmailWithMacrosManager.SendEmailFromTo(caseId, templateId, sender, recipientEmail);
			} catch (Exception ex) {
				_log.ErrorFormat(
					"[UsrSendEmailToCaseOwnerOnReply] Error sending email. CaseId={0}, TemplateId={1}, Recipient={2}. {3}",
					caseId, templateId, recipientEmail, ex.Message);
			}
		}

		#endregion

		#region Methods: Public

		public void Execute() {
			if (ActivityId == Guid.Empty) return;

			Guid caseId = GetCaseIdByActivity(ActivityId);
			if (caseId == Guid.Empty) {
				_log.WarnFormat("[UsrSendEmailToCaseOwnerOnReply] CaseId not found for ActivityId={0}", ActivityId);
				return;
			}

			Entity caseEntity = LoadCase(caseId);
			if (caseEntity == null) {
				_log.WarnFormat("[UsrSendEmailToCaseOwnerOnReply] Case not found. CaseId={0}", caseId);
				return;
			}

			Guid statusId = caseEntity.GetTypedColumnValue<Guid>(_statusIdCol);
			Guid categoryId = caseEntity.GetTypedColumnValue<Guid>(_categoryIdCol);
			Guid ownerId = caseEntity.GetTypedColumnValue<Guid>(_ownerIdCol);
			string ownerEmail = caseEntity.GetTypedColumnValue<string>(_ownerEmailCol);
			Guid groupId = caseEntity.GetTypedColumnValue<Guid>(_groupIdCol);

			var rules = GetRules(statusId, categoryId);
			foreach (var rule in rules) {
				Guid templateId = rule.GetTypedColumnValue<Guid>(_ruleTemplateIdCol);
				if (templateId == Guid.Empty) continue;

				string recipientType = rule.GetTypedColumnValue<string>(_ruleRecipientTypeNameCol);

				if (recipientType == RecipientTypeOwner) {
					if (ownerId == Guid.Empty) continue;
					SendToRecipient(caseId, templateId, ownerEmail);

				} else if (recipientType == RecipientTypeRole) {
					Guid roleId = rule.GetTypedColumnValue<Guid>(_ruleRoleIdCol);
					var emails = GetRoleEmails(roleId);
					foreach (var email in emails) {
						SendToRecipient(caseId, templateId, email);
					}

				} else if (recipientType == RecipientTypeGroup) {
					var emails = GetGroupEmails(groupId);
					foreach (var email in emails) {
						SendToRecipient(caseId, templateId, email);
					}
				}
			}
		}

		#endregion

	}

	#endregion
}
