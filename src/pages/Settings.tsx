export default function Settings() {
  return (
    <div className="nexus-card p-6 space-y-4">
      <div className="font-bold">الإعدادات / Paramètres / Settings</div>
      <div className="text-sm text-slate-500">
        إدارة مفاتيح الربط، صلاحيات المستخدمين، وسياسات الأمان حسب متطلبات المنصة.
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="text-xs text-slate-400">سياسة الوصول</div>
          <div className="font-semibold">Role-Based Access Control</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4">
          <div className="text-xs text-slate-400">المزامنة</div>
          <div className="font-semibold">Supabase / Local</div>
        </div>
      </div>
    </div>
  )
}
