"use client";
import { createContext, useContext, useState, useEffect } from "react";

export const allLanguages = [
  { code: "en", flag: "🇺🇸", name: "English" },
  { code: "hi", flag: "🇮🇳", name: "Hindi" },
  { code: "es", flag: "🇪🇸", name: "Spanish" },
  { code: "fr", flag: "🇫🇷", name: "French" },
  { code: "de", flag: "🇩🇪", name: "German" },
  { code: "ar", flag: "🇸🇦", name: "Arabic" },
  { code: "pt", flag: "🇵🇹", name: "Portuguese" },
  { code: "ru", flag: "🇷🇺", name: "Russian" },
  { code: "ja", flag: "🇯🇵", name: "Japanese" },
  { code: "ko", flag: "🇰🇷", name: "Korean" },
  { code: "zh", flag: "🇨🇳", name: "Chinese" },
  { code: "bn", flag: "🇧🇩", name: "Bengali" },
  { code: "ur", flag: "🇵🇰", name: "Urdu" },
  { code: "id", flag: "🇮🇩", name: "Indonesian" },
  { code: "ms", flag: "🇲🇾", name: "Malay" },
  { code: "th", flag: "🇹🇭", name: "Thai" },
  { code: "vi", flag: "🇻🇳", name: "Vietnamese" },
  { code: "tl", flag: "🇵🇭", name: "Filipino" },
  { code: "tr", flag: "🇹🇷", name: "Turkish" },
  { code: "ne", flag: "🇳🇵", name: "Nepali" },
  { code: "si", flag: "🇱🇰", name: "Sinhala" },
  { code: "my", flag: "🇲🇲", name: "Burmese" },
];

export const TRANSLATIONS: any = {
  en: {
    email:"Email Address", enterEmail:"Enter your email", send:"Send OTP", enterOtp:"Enter OTP sent to", verify:"Verify & Continue", change:"Change email", setup:"Setup your profile", addPhoto:"Tap to add photo", enterName:"Enter your name", continue:"Continue to Home", searchLang:"Search language",
    home:"Home", chat:"Chat", status:"Status", online:"Online", groups:"Groups", profile:"Profile",
    welcome:"Welcome", messages:"Messages", noMsg:"No messages yet", typeMsg:"Type a message...", sendMsg:"Send",
    createGroup:"Create Group", groupName:"Group Name", members:"Members", logout:"Logout", settings:"Settings"
  },
  hi: {
    email:"ईमेल पता", enterEmail:"अपना ईमेल दर्ज करें", send:"ओटीपी भेजें", enterOtp:"ओटीपी भेजा गया", verify:"सत्यापित करें", change:"ईमेल बदलें", setup:"प्रोफ़ाइल सेट करें", addPhoto:"फोटो जोड़ें", enterName:"नाम दर्ज करें", continue:"होम पर जाएं", searchLang:"भाषा खोजें",
    home:"होम", chat:"चैट", status:"स्थिति", online:"ऑनलाइन", groups:"समूह", profile:"प्रोफ़ाइल",
    welcome:"स्वागत है", messages:"संदेश", noMsg:"अभी कोई संदेश नहीं", typeMsg:"संदेश लिखें...", sendMsg:"भेजें",
    createGroup:"समूह बनाएं", groupName:"समूह का नाम", members:"सदस्य", logout:"लॉगआउट", settings:"सेटिंग्स"
  },
  es: {
    email:"Correo", enterEmail:"Ingresa tu correo", send:"Enviar OTP", enterOtp:"OTP enviado a", verify:"Verificar", change:"Cambiar correo", setup:"Configura tu perfil", addPhoto:"Toca para añadir foto", enterName:"Ingresa tu nombre", continue:"Continuar", searchLang:"Buscar idioma",
    home:"Inicio", chat:"Chat", status:"Estado", online:"En línea", groups:"Grupos", profile:"Perfil",
    welcome:"Bienvenido", messages:"Mensajes", noMsg:"Sin mensajes", typeMsg:"Escribe un mensaje...", sendMsg:"Enviar",
    createGroup:"Crear Grupo", groupName:"Nombre del grupo", members:"Miembros", logout:"Cerrar sesión", settings:"Ajustes"
  },
  fr: { email:"Email", enterEmail:"Entrez votre email", send:"Envoyer OTP", enterOtp:"OTP envoyé à", verify:"Vérifier", change:"Changer", setup:"Configurez profil", addPhoto:"Ajouter photo", enterName:"Nom", continue:"Continuer", searchLang:"Chercher langue", home:"Accueil", chat:"Chat", status:"Statut", online:"En ligne", groups:"Groupes", profile:"Profil", welcome:"Bienvenue", messages:"Messages", noMsg:"Pas de messages", typeMsg:"Tapez un message...", sendMsg:"Envoyer", createGroup:"Créer Groupe", groupName:"Nom du groupe", members:"Membres", logout:"Déconnexion", settings:"Paramètres" },
  de: { email:"E-Mail", enterEmail:"E-Mail eingeben", send:"OTP senden", enterOtp:"OTP gesendet an", verify:"Überprüfen", change:"Ändern", setup:"Profil einrichten", addPhoto:"Foto hinzufügen", enterName:"Name", continue:"Weiter", searchLang:"Sprache suchen", home:"Startseite", chat:"Chat", status:"Status", online:"Online", groups:"Gruppen", profile:"Profil", welcome:"Willkommen", messages:"Nachrichten", noMsg:"Keine Nachrichten", typeMsg:"Nachricht schreiben...", sendMsg:"Senden", createGroup:"Gruppe erstellen", groupName:"Gruppenname", members:"Mitglieder", logout:"Abmelden", settings:"Einstellungen" },
  ar: { email:"البريد", enterEmail:"أدخل بريدك", send:"إرسال OTP", enterOtp:"تم إرسال OTP إلى", verify:"تحقق", change:"تغيير", setup:"إعداد الملف", addPhoto:"إضافة صورة", enterName:"الاسم", continue:"متابعة", searchLang:"بحث لغة", home:"الرئيسية", chat:"دردشة", status:"حالة", online:"متصل", groups:"مجموعات", profile:"الملف", welcome:"مرحبا", messages:"رسائل", noMsg:"لا رسائل", typeMsg:"اكتب رسالة...", sendMsg:"إرسال", createGroup:"إنشاء مجموعة", groupName:"اسم المجموعة", members:"أعضاء", logout:"تسجيل خروج", settings:"إعدادات" },
  pt: { email:"Email", enterEmail:"Digite seu email", send:"Enviar OTP", enterOtp:"OTP enviado para", verify:"Verificar", change:"Mudar email", setup:"Configure perfil", addPhoto:"Adicionar foto", enterName:"Nome", continue:"Continuar", searchLang:"Buscar idioma", home:"Início", chat:"Chat", status:"Status", online:"Online", groups:"Grupos", profile:"Perfil", welcome:"Bem-vindo", messages:"Mensagens", noMsg:"Sem mensagens", typeMsg:"Digite mensagem...", sendMsg:"Enviar", createGroup:"Criar Grupo", groupName:"Nome do grupo", members:"Membros", logout:"Sair", settings:"Configurações" },
  ru: { email:"Email", enterEmail:"Введите email", send:"Отправить OTP", enterOtp:"OTP отправлен на", verify:"Проверить", change:"Изменить", setup:"Настройте профиль", addPhoto:"Добавить фото", enterName:"Имя", continue:"Продолжить", searchLang:"Поиск языка", home:"Главная", chat:"Чат", status:"Статус", online:"Онлайн", groups:"Группы", profile:"Профиль", welcome:"Добро пожаловать", messages:"Сообщения", noMsg:"Нет сообщений", typeMsg:"Введите сообщение...", sendMsg:"Отправить", createGroup:"Создать группу", groupName:"Название группы", members:"Участники", logout:"Выйти", settings:"Настройки" },
  ja: { email:"メール", enterEmail:"メールを入力", send:"OTP送信", enterOtp:"OTP送信済み", verify:"確認", change:"変更", setup:"プロフィール設定", addPhoto:"写真を追加", enterName:"名前", continue:"続行", searchLang:"言語検索", home:"ホーム", chat:"チャット", status:"ステータス", online:"オンライン", groups:"グループ", profile:"プロフィール", welcome:"ようこそ", messages:"メッセージ", noMsg:"メッセージなし", typeMsg:"メッセージを入力...", sendMsg:"送信", createGroup:"グループ作成", groupName:"グループ名", members:"メンバー", logout:"ログアウト", settings:"設定" },
  ko: { email:"이메일", enterEmail:"이메일 입력", send:"OTP 보내기", enterOtp:"OTP 전송됨", verify:"확인", change:"변경", setup:"프로필 설정", addPhoto:"사진 추가", enterName:"이름", continue:"계속", searchLang:"언어 검색", home:"홈", chat:"채팅", status:"상태", online:"온라인", groups:"그룹", profile:"프로필", welcome:"환영합니다", messages:"메시지", noMsg:"메시지 없음", typeMsg:"메시지 입력...", sendMsg:"보내기", createGroup:"그룹 만들기", groupName:"그룹 이름", members:"회원", logout:"로그아웃", settings:"설정" },
  zh: { email:"邮箱", enterEmail:"输入邮箱", send:"发送验证码", enterOtp:"验证码已发送至", verify:"验证", change:"更改", setup:"设置资料", addPhoto:"添加照片", enterName:"姓名", continue:"继续", searchLang:"搜索语言", home:"首页", chat:"聊天", status:"状态", online:"在线", groups:"群组", profile:"我的", welcome:"欢迎", messages:"消息", noMsg:"暂无消息", typeMsg:"输入消息...", sendMsg:"发送", createGroup:"创建群组", groupName:"群组名称", members:"成员", logout:"退出", settings:"设置" },
  bn: { email:"ইমেইল", enterEmail:"ইমেইল লিখুন", send:"OTP পাঠান", enterOtp:"OTP পাঠানো হয়েছে", verify:"যাচাই", change:"পরিবর্তন", setup:"প্রোফাইল সেটআপ", addPhoto:"ছবি যোগ করুন", enterName:"নাম", continue:"চালিয়ে যান", searchLang:"ভাষা খুঁজুন", home:"হোম", chat:"চ্যাট", status:"স্ট্যাটাস", online:"অনলাইন", groups:"গ্রুপ", profile:"প্রোফাইল", welcome:"স্বাগতম", messages:"বার্তা", noMsg:"কোন বার্তা নেই", typeMsg:"বার্তা লিখুন...", sendMsg:"পাঠান", createGroup:"গ্রুপ তৈরি", groupName:"গ্রুপের নাম", members:"সদস্য", logout:"লগআউট", settings:"সেটিংস" },
  id: { email:"Email", enterEmail:"Masukkan email", send:"Kirim OTP", enterOtp:"OTP dikirim ke", verify:"Verifikasi", change:"Ubah", setup:"Atur profil", addPhoto:"Tambah foto", enterName:"Nama", continue:"Lanjut", searchLang:"Cari bahasa", home:"Beranda", chat:"Obrolan", status:"Status", online:"Online", groups:"Grup", profile:"Profil", welcome:"Selamat datang", messages:"Pesan", noMsg:"Belum ada pesan", typeMsg:"Ketik pesan...", sendMsg:"Kirim", createGroup:"Buat Grup", groupName:"Nama grup", members:"Anggota", logout:"Keluar", settings:"Pengaturan" },
};

const LangContext = createContext<any>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langCode, setLangCode] = useState("en");
  const [mounted, setMounted] = useState(false);

  useEffect(()=>{
    const saved = localStorage.getItem("app_lang") || "en";
    setLangCode(saved);
    setMounted(true);
  },[]);

  const changeLang = (code: string) => {
    setLangCode(code);
    localStorage.setItem("app_lang", code);
  };

  const t = TRANSLATIONS[langCode] || TRANSLATIONS["en"];
  const currentLang = allLanguages.find(l=>l.code===langCode) || allLanguages[0];

  if(!mounted) return null;

  return (
    <LangContext.Provider value={{ langCode, changeLang, t, currentLang, allLanguages }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage(){
  return useContext(LangContext);
       }
