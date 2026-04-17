import React, { useState } from 'react';
import { Send, Bell, Users, Car, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [targetAudience, setTargetAudience] = useState('all'); // all, drivers, riders, specific
  const [platform, setPlatform] = useState('both'); // both, ios, android
  const [specificPhone, setSpecificPhone] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSend = () => {
    if (!title || !message) return;
    setStatus('sending');
    // Simulated API call
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setTitle('');
        setMessage('');
        setSpecificPhone('');
      }, 3000);
    }, 1500);
  };

  return (
    <div className={`max-w-4xl mx-auto ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isRTL ? 'إدارة الإشعارات المركزية' : 'Push Notifications'}</h1>
        <p className="text-gray-500 mt-2">{isRTL ? 'إرسال تنبيهات ورسائل ترويجية أو إدارية للسائقين والعملاء' : 'Send push alerts to drivers and riders'}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* Target Audience */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{isRTL ? 'تحديد المستفيدين' : 'Target Audience'}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'all', icon: Users, label: isRTL ? 'الجميع' : 'Everyone' },
                { id: 'drivers', icon: Car, label: isRTL ? 'السائقين فقط' : 'Drivers Only' },
                { id: 'riders', icon: Smartphone, label: isRTL ? 'الزبائن فقط' : 'Riders Only' },
                { id: 'specific', icon: Bell, label: isRTL ? 'رقم محدد' : 'Specific User' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTargetAudience(item.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    targetAudience === item.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={24} className="mb-2" />
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              ))}
            </div>

            {targetAudience === 'specific' && (
              <div className="mt-4">
                <input
                  type="text"
                  placeholder={isRTL ? 'أدخل رقم الهاتف (مثال: 0912345678)' : 'Enter phone number'}
                  value={specificPhone}
                  onChange={(e) => setSpecificPhone(e.target.value)}
                  className="w-full sm:w-1/2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            )}
          </section>

          {/* Platform */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{isRTL ? 'نظام التشغيل (المنصة)' : 'Platform'}</h2>
            <div className="flex gap-4">
              {[
                { id: 'both', label: isRTL ? 'الكل (iOS & Android)' : 'All (iOS & Android)' },
                { id: 'ios', label: 'Apple iOS' },
                { id: 'android', label: 'Android' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-6 py-2 rounded-full border text-sm font-bold transition-all ${
                    platform === p.id 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Message Content */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{isRTL ? 'محتوى الإشعار' : 'Message Content'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'عنوان الإشعار' : 'Title'}</label>
                <input
                  type="text"
                  placeholder={isRTL ? 'أدخل عنوان التنبيه...' : 'Notification Title...'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isRTL ? 'نص الرسالة' : 'Message'}</label>
                <textarea
                  placeholder={isRTL ? 'اكتب الرسالة التي ستظهر للمستخدمين...' : 'Type your message...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </div>
          </section>

          {/* Action */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
               onClick={handleSend}
               disabled={!title || !message || status === 'sending'}
               className={`flex items-center px-8 py-4 rounded-xl text-white font-bold transition-all shadow-md ${
                 (!title || !message) ? 'bg-gray-300 cursor-not-allowed' :
                 status === 'success' ? 'bg-blue-600' :
                 'bg-emerald-600 hover:bg-emerald-700'
               }`}
            >
              <Send size={18} className={isRTL ? 'ml-2' : 'mr-2'} />
              {status === 'sending' ? (isRTL ? 'جاري الإرسال...' : 'Sending...') :
               status === 'success' ? (isRTL ? 'تم الإرسال بنجاح!' : 'Sent Successfully!') :
               (isRTL ? 'إرسال الإشعار الآن' : 'Push Notification')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
