namespace BPMSoft.Configuration
{
	using System;
	using System.Collections.Generic;
	using BPMSoft.Common;
	using BPMSoft.Core;
	using BPMSoft.Core.Entities;

	#region Class: UsrLatestCustomerEmailGenerator

	public class UsrLatestCustomerEmailGenerator : IMacrosInvokable
	{

		#region Properties: Public

		public UserConnection UserConnection { get; set; }

		#endregion

		#region Methods: Private

		private Guid GetActivityId(object argument) {
			var recordArgument = argument as KeyValuePair<string, Guid>?;
			return recordArgument.HasValue ? recordArgument.Value.Value : Guid.Empty;
		}

		#endregion

		#region Methods: Public

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
