const FA={
 username_exists:"این نام کاربری قبلاً استفاده شده است.",
 invalid_username:"نام کاربری باید ۳ تا ۲۰ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد.",
 invalid_channel_username:"شناسه کانال نامعتبر است. فقط حروف انگلیسی، عدد و _ مجاز است.",
 channel_username_exists:"این شناسه کانال قبلاً استفاده شده است.",
 username_required_for_public_channel:"برای کانال عمومی باید یک شناسه عمومی انتخاب کنید.",
 invalid_display_name:"نام نمایشی باید بین ۱ تا ۸۰ کاراکتر باشد.",
 invalid_password:"رمز عبور باید بین ۶ تا ۱۲۸ کاراکتر باشد.",
 weak_password:"رمز عبور باید بین ۶ تا ۱۲۸ کاراکتر باشد.",
 registration_disabled:"ثبت‌نام در حال حاضر غیرفعال است.",
 registration_check_failed:"بررسی وضعیت ثبت‌نام انجام نشد. دوباره تلاش کنید.",
 not_authenticated:"لطفاً ابتدا وارد حساب شوید.",
 unauthorized:"نشست ورود معتبر نیست. دوباره وارد شوید.",
 forbidden:"دسترسی به این بخش را ندارید.",
 permission_denied:"دسترسی به این بخش را ندارید.",
 not_allowed:"این عملیات برای شما مجاز نیست.",
 invalid_title:"عنوان واردشده نامعتبر است.",
 invalid_description:"توضیحات بیش از حد طولانی است.",
 public_conversation_not_found:"این گروه یا کانال عمومی دیگر در دسترس نیست.",
 invalid_invite:"لینک دعوت نامعتبر یا منقضی شده است.",
 user_not_found:"کاربر پیدا نشد.",
 profile_create_failed:"ساخت پروفایل انجام نشد. دوباره تلاش کنید.",
 profile_update_failed:"به‌روزرسانی پروفایل انجام نشد.",
 user_create_failed:"ساخت کاربر انجام نشد. اطلاعات را بررسی کنید.",
 user_delete_failed:"حذف کاربر انجام نشد.",
 password_update_failed:"تغییر رمز عبور انجام نشد.",
 ban_update_failed:"تغییر وضعیت مسدودی انجام نشد.",
 audit_log_failed:"عملیات انجام شد اما ثبت گزارش مدیریت ناموفق بود. لطفاً دوباره بررسی کنید.",
 invalid_message:"متن پیام نامعتبر است.",
 network:"ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",
 server_error:"خطایی در سرور رخ داد. لطفاً دوباره تلاش کنید.",
 internal_error:"خطایی رخ داد. لطفاً دوباره تلاش کنید.",
 method_not_allowed:"این عملیات پشتیبانی نمی‌شود.",
};
const EN={
 username_exists:"That username is already in use.",invalid_username:"Username must be 3–20 characters using a-z, numbers, or _.",invalid_channel_username:"Channel username is invalid.",channel_username_exists:"That channel username is already in use.",username_required_for_public_channel:"A public channel needs a public username.",invalid_display_name:"Display name must be 1–80 characters.",invalid_password:"Password must be 6–128 characters.",weak_password:"Password must be 6–128 characters.",registration_disabled:"Registration is currently disabled.",registration_check_failed:"We could not check registration status. Please try again.",not_authenticated:"Please sign in first.",unauthorized:"Your session is not valid. Please sign in again.",forbidden:"You do not have permission to do this.",permission_denied:"You do not have permission to do this.",not_allowed:"This action is not allowed for your account.",invalid_title:"The title is invalid.",invalid_description:"The description is too long.",public_conversation_not_found:"This public group or channel is no longer available.",invalid_invite:"This invite link is invalid or expired.",user_not_found:"User not found.",profile_create_failed:"Could not create the profile. Please try again.",profile_update_failed:"Could not update the profile.",user_create_failed:"Could not create the user. Check the information and try again.",user_delete_failed:"Could not delete the user.",password_update_failed:"Could not change the password.",ban_update_failed:"Could not update the ban status.",audit_log_failed:"The action completed but the audit log could not be saved.",invalid_message:"The message is invalid.",network:"Could not connect to the server. Please try again.",server_error:"A server error occurred. Please try again.",internal_error:"Something went wrong. Please try again.",method_not_allowed:"This operation is not supported.",};
export function mapError(error,locale="fa"){
 const code=typeof error==="string"?error:(error?.code||error?.message||"");
 const raw=String(code).toLowerCase();
 if(raw.includes("failed to fetch")||raw.includes("networkerror")||raw.includes("load failed")) return locale==="en"?EN.network:FA.network;
 if(raw.includes("23505")||raw.includes("duplicate key")||raw.includes("unique constraint")) return locale==="en"?EN.username_exists:FA.username_exists;
 const key=Object.keys(locale==="en"?EN:FA).find(k=>raw===k||raw.includes(k));
 return (locale==="en"?EN:FA)[key]|| (locale==="en"?"Something went wrong. Please try again.":"خطایی رخ داد. لطفاً دوباره تلاش کنید.");
}
export default mapError;
