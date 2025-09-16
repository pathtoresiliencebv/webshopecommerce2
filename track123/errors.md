Errors
HTTP status code
Track123 uses HTTP status codes to indicate the status of the request.

Status code	Type	Description
200	Success	Request succeeded.
400	Bad Request	The request type is incorrect，e.g. incorrect request parameters.
500	Server Error	Something went wrong on Track123's end.
Service status code
Track123 uses service status codes (i.e. the code field in the response object) to mark the status of the request at the service level.

Status code	Type	Description
00000	SUCCESS	Success
A0001	USER_ERROR	User terminal error.
A0200	USER_LOGIN_ERROR	Server error.
A0201	USER_NOT_EXIST	Account does not exist.
A0202	USER_ACCOUNT_LOCKED	The user account is locked.
A0203	USER_ACCOUNT_INVALID	The user account is invalid.
A0230	TOKEN_INVALID_OR_EXPIRED	Token is invalid or expired.
A0231	TOKEN_ACCESS_FORBIDDEN	Token has been forbidden.
A0300	AUTHORIZED_ERROR	Abnormal access rights.
A0301	ACCESS_UNAUTHORIZED	Unauthorized access.
A0400	PARAM_ERROR	User request parameter error.
A0410	PARAM_IS_NULL	The parameter for the request is null.
B0001	SYSTEM_EXECUTION_ERROR	System error.
B0100	SYSTEM_EXECUTION_TIMEOUT	System timeout.
B0100	SYSTEM_ORDER_PROCESSING_TIMEOUT	System timeout.
B0210	FLOW_LIMITING	Exceed flow limits.
B0300	SYSTEM_RESOURCE_ERROR	Abnormal system resources.
B0310	SYSTEM_RESOURCE_EXHAUSTION	System resources are exhausted.
C0113	INTERFACE_NOT_EXIST	The interface does not exist.
D0000	SERVICE_DETAIL_MSG_ERROR	Other errors, detailed information will be returned in msg or data.
Query status code
query status code	type	description
001	NORMAL_QUERY	Normal Track
002	NO_RECORD	Not Found
003	UNSTABLE_OFFICIAL_WEBSITE	Web Error
004	OFFICIAL_WEBSITE_FORMAT_CHANGES	Process Error
005	CACHE_FOR_WEBSITE_ERROR	Web Error [Cache]
006	CACHE_FOR_DEAL_ERROR	Process Error [Cache]
