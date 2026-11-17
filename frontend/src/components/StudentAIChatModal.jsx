import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, X, Bot, Sparkles, User, RefreshCw, 
  Copy, Check, BookOpen, HelpCircle, Lightbulb, Zap, Maximize2, Minimize2, Compass
} from 'lucide-react';
import { studentAPI } from '../services/api';

// دالة مساعدة لفك نصوص الأسئلة المخزنة بتنسيق JSON إن وجدت
function getCleanQuestionText(raw) {
  if (!raw) return '';
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.question) return parsed.question;
    } catch (e) {}
  }
  return String(raw);
}

export default function StudentAIChatModal({ 
  isOpen, 
  onClose, 
  studentName = 'يا بطل',
  contextQuestion = null,
  onClearContext = null
}) {
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `أهلاً بك يا ${studentName}! 👨‍🏫✨
أنا «مستر كَنترول» - معلمك الخصوصي الشامل لجميع المواد الدراسية في المناهج المصرية 🇪🇬 (فيزياء، كيمياء، أحياء، رياضيات، لغة عربية، لغة إنجليزية، فلسفة، تاريخ...).

✨ **مش محتاج تحدد المادة!**
اسألني عن أي سؤال أو مسألة في أي مادة، وهتعرف عليها بذكاء وهشرحهالك خطوة بخطوة بطريقة مبسطة مع أمثلة وتريكات امتحانات الثانوية العامة! 💪🎯`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeContext, setActiveContext] = useState(contextQuestion);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastProcessedContextRef = useRef(null);

  // تحديث سياق السؤال واستدعاء Gemini AI مباشرة لتحليله
  useEffect(() => {
    if (contextQuestion && isOpen) {
      setActiveContext(contextQuestion);

      const contextKey = `${contextQuestion.examTitle}-${contextQuestion.questionIndex}-${contextQuestion.studentAnswer}`;
      if (lastProcessedContextRef.current === contextKey) {
        return; // تجنب التكرار لنفس السؤال
      }
      lastProcessedContextRef.current = contextKey;

      const qText = getCleanQuestionText(contextQuestion.questionText);
      const qNum = contextQuestion.questionIndex || 1;
      const examName = contextQuestion.examTitle || 'الامتحان';

      // 1. رسالة استفسار تلقائية تظهر كأن الطالب يطلب الشرح
      const userAskMsg = {
        id: 'user-ask-' + Date.now(),
        role: 'user',
        content: `يا مستر، أخطأت في السؤال رقم (${qNum}) من امتحان "${examName}" ومحتاجك تشرحهولي:
📌 **السؤال:** "${qText || 'سؤال في ' + (contextQuestion.subject || 'المادة')}"
• إجابتي التي اخترتها: (${contextQuestion.studentAnswer || 'فارغ'}) ❌
• الإجابة الصحيحة النموذجية: (${contextQuestion.correctAnswer || 'غير محدد'}) ✅
ممكن تشرحلي الفكرة وازاي أحله وليه اختياري كان غلط؟`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, userAskMsg]);
      setLoading(true);

      // 2. استدعاء Google Gemini AI مباشرة لتقديم الشرح الحي الفوري!
      studentAPI.aiChat({
        message: `اشرحلي السؤال رقم (${qNum}) من امتحان "${examName}". السؤال: "${qText}". إجابتي السابقة كانت (${contextQuestion.studentAnswer}) والإجابة الصحيحة هي (${contextQuestion.correctAnswer}). وضح لي فكرة السؤال، ولماذا خياري كان خطأ، وخطوات الحل النموذجي.`,
        history: [],
        subject: contextQuestion.subject || 'جميع المواد',
        contextQuestion: contextQuestion
      }).then(res => {
        const aiReply = res.data?.reply || 'أهلاً بك يا بطل! السؤال ده فكرته ممتازة، تعال نفهمها سوا خطوة بخطوة!';
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-reply-' + Date.now(),
            role: 'assistant',
            content: aiReply,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            provider: res.data?.provider || 'Google Gemini AI Tutor'
          }
        ]);
      }).catch(err => {
        console.error('Failed to get AI explanation for question context:', err);
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            role: 'assistant',
            content: `أهلاً بك يا ${studentName}! بخصوص السؤال رقم (${qNum}) من "${examName}": الإجابة الصحيحة هي (${contextQuestion.correctAnswer}). اكتب لي الجزئية اللي حسيتها مش واضحة في السؤال وهشرحهالك فوراً بمثال مبسط! 💡`,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [contextQuestion, isOpen]);

  // التمرير التلقائي لآخر رسالة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // التركيز على حقل الإدخال عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // تجهيز سجل المحادثة
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content
        }));

      const res = await studentAPI.aiChat({
        message: textToSend.trim(),
        history,
        subject: 'كشف تلقائي بالذكاء الاصطناعي لكافة المواد',
        contextQuestion: activeContext
      });

      const aiReply = res.data?.reply || 'عفواً يا بطل، حصل خطأ بسيط في الاتصال. اعد كتابة سؤالك وهكون معاك!';

      setMessages(prev => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          content: aiReply,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          provider: res.data?.provider
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'عذراً يا بطل، واجهت مشكلة في الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت وإعادة المحاولة. مستر كَنترول في انتظارك! 👨‍🏫',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('هل تريد بدء جلسة مذاكرة جديدة ومسح الرسائل الحالية؟')) {
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: `أهلاً بك من جديد يا ${studentName}! 👨‍🏫 مسحنا الرسائل السابقة وجاهز لأي سؤال جديد في أي مادة (فيزياء، كيمياء، أحياء، رياضيات، عربي، إنجليزي...). اسألني عن أي حاجة!`,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveContext(null);
      lastProcessedContextRef.current = null;
      if (onClearContext) onClearContext();
    }
  };

  const quickPrompts = [
    { label: '⚡ قاعدة لنز في الفيزياء', prompt: 'يا مستر، اشرح لي قاعدة لنز في الحث الكهرومغناطيسي بطريقة سهلة ومثال من الحياة اليومية' },
    { label: '📐 مسائل كيرشوف والرياضيات', prompt: 'إزاي أحل أي مسألة كيرشوف أول وتاني بخطوات منظمة تضمن إني ما اتلخبطش في الإشارات؟' },
    { label: '🧪 معادلات الكيمياء العضوية', prompt: 'اشرحلي ببساطة الفرق بين تفاعلات الإضافة والاستبدال في الكيمياء العضوية' },
    { label: '📖 إعراب وقواعد النحو', prompt: 'اشرحلي الفرق بين لا النافية للجنس ولا النافية للفعل وإعراب الاسم بعد كل واحدة' },
    { label: '🎯 اختبرني بسؤال ذكي', prompt: 'اسألني سؤال تطبيقي ذكي من أسئلة الامتحانات يختبر فهمي ويكون فيه فكرة غير تقليدية!' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-cairo text-right selection:bg-[#02936C] selection:text-white">
      
      {/* Container */}
      <div className={`bg-white w-full flex flex-col shadow-2xl transition-all duration-200 border border-slate-200 ${
        isMaximized 
          ? 'h-full sm:h-[95vh] sm:max-w-4xl sm:rounded-[2.5rem]' 
          : 'h-[92vh] sm:h-[650px] sm:max-w-2xl sm:rounded-[2rem] rounded-t-[2rem]'
      } overflow-hidden`}>
        
        {/* ========================================================
            1. الهيدر العلوي للمحادثة (Tutor Chat Header)
        ======================================================== */}
        <div className="px-5 py-3.5 bg-gradient-to-l from-[#03243F] via-[#063154] to-[#02936C] text-white flex items-center justify-between shrink-0 shadow-md">
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-inner">
                👨‍🏫
              </div>
              <span className="w-3 h-3 bg-emerald-400 border-2 border-[#03243F] rounded-full absolute -bottom-0.5 -left-0.5 animate-pulse" title="متصل الآن ومتاح لمساعدتك" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">مستر كَنترول الذكي</h3>
                <span className="text-[10px] bg-emerald-500/25 border border-emerald-300/40 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  AI Tutor 24/7
                </span>
              </div>
              <p className="text-[11px] text-slate-200 font-bold flex items-center gap-1">
                <span>معلمك الخصوصي الشامل لجميع المواد</span>
                <span className="text-emerald-300">• Gemini AI 🧠</span>
              </p>
            </div>
          </div>

          {/* أزرار التحكم بالنافذة */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              title="بدء جلسة مذاكرة جديدة ومسح الرسائل"
              className="p-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "تصغير النافذة" : "تكبير النافذة"}
              className="p-1.5 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition hidden sm:inline-block"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="إغلاق الشات"
              className="p-1.5 text-slate-200 hover:text-white hover:bg-red-500/30 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* ========================================================
            2. شريط الوضع الشامل وسياق السؤال المثبت
        ======================================================== */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-[#03243F] bg-white border border-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <span>🌐 معلم شامل لكافة المواد</span>
              <span className="text-[10px] text-[#02936C] font-bold hidden sm:inline">• يتعرف على المادة تلقائياً</span>
            </span>
          </div>

          {activeContext && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#02936C] px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0">
              <span>سياق السؤال #{activeContext.questionIndex || 1} ({activeContext.examTitle || 'الامتحان'})</span>
              <button
                onClick={() => {
                  setActiveContext(null);
                  lastProcessedContextRef.current = null;
                  if (onClearContext) onClearContext();
                }}
                className="hover:text-red-600 mr-1 font-bold text-slate-400 hover:bg-red-50 rounded px-1 transition"
                title="إلغاء ربط السؤال"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* كارت السؤال المثبت بالتفصيل (في حال فتح الشات لسؤال محدد) */}
        {activeContext && (
          <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200/80 text-xs shrink-0 flex items-center justify-between gap-2">
            <div className="truncate flex items-center gap-1.5 text-right">
              <span className="text-amber-600 font-bold shrink-0">📌</span>
              <span className="font-black text-[#03243F] shrink-0">
                سؤال رقم ({activeContext.questionIndex || 1}):
              </span>
              <span className="text-slate-700 truncate font-medium">
                "{getCleanQuestionText(activeContext.questionText)}"
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[10px] font-bold">
              <span className="text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                إجابتك: {activeContext.studentAnswer || 'فارغ'} ❌
              </span>
              <span className="text-[#02936C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                الصحيحة: {activeContext.correctAnswer || 'غير محدد'} ✅
              </span>
            </div>
          </div>
        )}

        {/* ========================================================
            3. منطقة عرض رسائل المحادثة (Messages Stream)
        ======================================================== */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8FAFC]">
          
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-xs ${
                  isUser 
                    ? 'bg-[#02936C] text-white' 
                    : 'bg-gradient-to-tr from-[#03243F] to-[#063154] text-white'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : '👨‍🏫'}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#02936C] text-white rounded-tl-xs font-bold'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tr-xs font-medium space-y-2'
                  }`}>
                    <div className="whitespace-pre-line">
                      {msg.content}
                    </div>

                    {!isUser && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                        <span>{msg.provider || 'Google Gemini AI'}</span>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="hover:text-[#02936C] flex items-center gap-1 transition p-1 rounded-lg hover:bg-slate-100"
                          title="نسخ الشرح"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#02936C]" />
                              <span className="text-[#02936C]">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <p className={`text-[10px] text-slate-400 font-bold px-1 ${isUser ? 'text-left' : 'text-right'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] ml-auto animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-[#03243F] text-white flex items-center justify-center text-sm shrink-0">
                👨‍🏫
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-3xl rounded-tr-xs shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#02936C]">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>مستر كَنترول يحلل السؤال ويبسط الشرح لك بـ Google Gemini...</span>
                </div>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-[#02936C] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#02936C] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#02936C] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        

        {/* ========================================================
            5. حقل إدخال الرسالة (Chat Input Bar)
        ======================================================== */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب أي سؤال أو مسألة في أي مادة (فيزياء، كيمياء، رياضيات، عربي، إنجليزي...)"
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#02936C] focus:ring-2 focus:ring-[#02936C]/20 transition"
            />

            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-[#02936C] hover:bg-[#027d5c] disabled:opacity-40 text-white p-3.5 rounded-2xl shadow-md shadow-[#02936C]/20 transition hover:scale-105 active:scale-95 flex items-center justify-center shrink-0"
              title="إرسال السؤال"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center font-bold mt-2">
            مستر كَنترول الذكي مدعوم بنماذج Google Gemini للتعليم الثانوي والإعدادي في مصر 🇪🇬
          </p>
        </div>

      </div>

    </div>
  );
}