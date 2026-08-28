/**
 * SafeSense AI — Conversational AI Engine
 *
 * Provides natural, human-friendly, context-aware chat responses.
 * Uses safety-priority rules + keyword analysis + conversation history.
 * NOT an LLM — responses are hand-crafted to feel warm and conversational.
 * Architecture designed so an LLM API call can replace generateResponse() later.
 *
 * IMPORTANT: Does NOT diagnose any medical or psychiatric condition.
 */

import type { Language } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ConvMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface ConvResponse {
  text: string;
  isSafetyCritical: boolean;
  hasFollowUp: boolean;
  detectedTopic?: string;
}

// ─── Safety-critical phrases ───────────────────────────────────────────────────

const CRITICAL_PHRASES: string[] = [
  'kill myself', 'end my life', 'suicide', 'want to die', 'hurt myself',
  'feel like to die', 'feel like dying', 'i feel like dying', 'i want die',
  'take my own life', "can't go on", 'not worth living', 'no reason to live',
  'end it all', 'wish i was dead',
  'खुद को मार', 'जीना नहीं', 'आत्महत्या', 'मर जाना चाहता', 'मर जाना चाहती',
  'स्वतःला मारणे', 'जगणे नको',
];

const SAFETY_UNCLEAR_PHRASES: string[] = [
  'i want to give up', 'i feel like giving up', "i'm giving up", 'i am giving up',
  'हार मानना', 'हार मानना चाहता', 'हार मानना चाहती', 'हार मानावी',
];

const DANGER_PHRASES: string[] = [
  'in danger', 'not safe', 'being hurt', 'someone hurting', 'he will hurt',
  'he hurt me', 'she hurt me', 'threatened me', 'will kill me', 'hit me',
  'unsafe', 'scared of him', 'scared of her', 'afraid to go home',
  'असुरक्षित', 'खतरे में', 'मार डालेगा', 'मारतो',
];

const CONTEXTUAL_PHRASES = {
  academic: ['exam', 'cet', 'result', 'failed', 'course', 'college', 'study', 'presentation'],
  rejection: ['ignore', 'ignored', 'laugh', 'joke', 'compare', 'nobody cares', 'no one cares'],
  withdrawal: ["don't want to talk", 'do not want to talk', 'shut everyone out', 'disappear', 'leave me alone'],
};

function hasAskedAbout(history: ConvMessage[], topic: keyof typeof CONTEXTUAL_PHRASES): boolean {
  const terms = CONTEXTUAL_PHRASES[topic];
  return history.some(message => terms.some(term => message.content.toLowerCase().includes(term)));
}

function contextualResponse(message: string, history: ConvMessage[], language: Language): string | null {
  if (language !== 'en') return null;
  const lower = message.toLowerCase();
  const academic = CONTEXTUAL_PHRASES.academic.some(term => lower.includes(term));
  const rejection = CONTEXTUAL_PHRASES.rejection.some(term => lower.includes(term));

  if (/parents are angry|my parents are angry|parents angry|family is angry/.test(lower) && hasAskedAbout(history, 'academic')) {
    return `That probably makes the result feel even heavier. You are dealing with the disappointment and their anger at the same time.`;
  }
  if (/compar/.test(lower) && hasAskedAbout(history, 'academic')) {
    return `Yeah… being compared when you are already disappointed in yourself can make the hurt feel even sharper. You do not have to earn your worth by matching someone else.`;
  }

  if (academic && rejection && !hasAskedAbout(history, 'rejection')) {
    return `That is a painful combination: being disappointed by the result and then feeling mocked or unsupported by people close to you. Their reaction does not turn you into a joke, and one exam cannot measure your ability.`;
  }
  if (rejection && !hasAskedAbout(history, 'rejection')) {
    return `That sounds really painful, especially when the people around you are adding to something that already hurts. You deserve support, not to be made smaller.`;
  }
  if (rejection && hasAskedAbout(history, 'rejection')) {
    return `Yeah… being compared or laughed at when you are already hurting can make the whole thing feel much heavier. You deserve a little gentleness here.`;
  }
  if (academic && hasAskedAbout(history, 'academic')) {
    return `That result clearly still has some weight to it. You do not have to decide what it means for your future all at once.`;
  }
  if (CONTEXTUAL_PHRASES.withdrawal.some(term => lower.includes(term))) {
    return `It sounds like you are running low on energy for people right now. You do not have to explain everything before you are ready.`;
  }
  return null;
}

// ─── Response Banks (natural, varied, human-sounding) ─────────────────────────

// Multiple variants per topic — picked by turn count to avoid repetition
const RESPONSE_VARIANTS = {
  safety_critical: {
    en: [
      `I hear you, and I'm really glad you told me. What you're feeling right now is real, and you deserve support. Please reach out to someone who can be with you — a trusted person, a helpline, or emergency services. You don't have to face this alone. I'm here.`,
      `That sounds like an incredibly painful place to be. Please don't carry this alone — there are people who want to help. Visit the Resources section for crisis contacts, or call your local emergency line right now. I'm here with you.`,
    ],
    hi: [
      `मैं सुन रहा/रही हूँ, और मुझे खुशी है कि आपने मुझे बताया। आप जो महसूस कर रहे हैं वह असली है, और आप सहायता के योग्य हैं। कृपया किसी से संपर्क करें — एक भरोसेमंद व्यक्ति, एक helpline, या emergency services। आप अकेले नहीं हैं।`,
      `यह सुनकर दिल दुखा। कृपया इसे अकेले मत झेलिए — ऐसे लोग हैं जो मदद करना चाहते हैं। आपातकालीन संपर्कों के लिए Resources सेक्शन देखें।`,
    ],
    mr: [
      `मी ऐकतो/ऐकते, आणि तुम्ही मला सांगितल्याबद्दल मला आनंद आहे. तुम्हाला आत्ता काय वाटत आहे ते खरे आहे, आणि तुम्हाला आधाराची गरज आहे. कृपया एखाद्याशी संपर्क करा — एक विश्वासू व्यक्ती, एक helpline, किंवा आपत्कालीन सेवा. तुम्ही एकटे नाही.`,
      `हे ऐकून खूप जड वाटले. कृपया हे एकट्याने सहन करू नका — Resources विभागात आपत्कालीन संपर्क आहेत.`,
    ],
  },

  immediate_danger: {
    en: [
      `Your safety matters most right now. If you're in immediate danger, please get to a safe place and contact emergency services. I'm here — can you tell me where you are and what's happening?`,
      `That sounds really frightening. Are you somewhere safe right now? If not, please try to get somewhere safer and contact emergency services. I'm listening.`,
    ],
    hi: [
      `अभी आपकी सुरक्षा सबसे ज़रूरी है। अगर आप तुरंत खतरे में हैं, तो किसी सुरक्षित जगह जाएँ और emergency services से संपर्क करें। मैं यहाँ हूँ — क्या आप बता सकते हैं क्या हो रहा है?`,
      `यह सुनकर डर लगता है। क्या आप अभी किसी सुरक्षित जगह हैं? अगर नहीं, तो कृपया emergency services को call करें।`,
    ],
    mr: [
      `आत्ता तुमची सुरक्षितता सर्वात महत्त्वाची आहे. जर तुम्हाला तात्काळ धोका असेल, तर सुरक्षित ठिकाणी जा आणि आपत्कालीन सेवांशी संपर्क करा. मी इथे आहे — काय होत आहे ते सांगू शकता का?`,
    ],
  },

  safety_unclear: {
    en: [
      `Hey… when you say you want to give up, do you mean on this situation, or are you thinking about hurting yourself? You don't have to carry this alone. If you might be in immediate danger, move near someone you trust and contact local emergency or crisis support now.`,
    ],
    hi: [
      `जब आप कहते हैं कि आप हार मानना चाहते हैं, क्या आपका मतलब इस situation से है, या खुद को नुकसान पहुँचाने का विचार आ रहा है? अगर अभी खतरा हो सकता है, तो किसी भरोसेमंद व्यक्ति के पास जाएँ और local emergency या crisis support से संपर्क करें।`,
    ],
    mr: [
      `तुम्ही हार मानायची म्हणता तेव्हा, या परिस्थितीबद्दल म्हणत आहात का, की स्वतःला इजा करण्याचा विचार येतोय? तात्काळ धोका असेल तर विश्वासू व्यक्तीजवळ जा आणि local emergency किंवा crisis support शी संपर्क करा.`,
    ],
  },

  advice: {
    en: [`I can help you think it through. What is pulling you toward that choice, and what is making you hesitate?`],
    hi: [`मैं आपके साथ इसे सोच सकता/सकती हूँ। आपको इस choice की तरफ क्या खींच रहा है, और किस बात पर आप रुक रहे हैं?`],
    mr: [`मी तुमच्यासोबत याचा विचार करू शकतो/शकते. या निर्णयाकडे तुम्हाला काय ओढत आहे, आणि कशामुळे तुम्ही थांबत आहात?`],
  },

  academic: {
    en: [`That kind of disappointment can sting, especially when you feel people are making fun of you instead of standing beside you. One exam does not decide your ability or your worth. What hurts more right now: the result, or how people are treating you?`],
    hi: [`ऐसी निराशा बहुत चुभ सकती है, खासकर जब लोग साथ देने के बजाय मज़ाक उड़ाएँ। एक exam आपकी काबिलियत या आपकी कीमत तय नहीं करता। अभी ज़्यादा दर्द किस बात का है: result या लोगों का व्यवहार?`],
    mr: [`अशी निराशा खूप बोचू शकते, विशेषतः लोक साथ देण्याऐवजी हसत असतील. एक exam तुमची क्षमता किंवा किंमत ठरवत नाही. आत्ता जास्त काय दुखतंय: result की लोकांची वागणूक?`],
  },

  rejection: {
    en: [`Feeling like nobody cares can make the world feel very small. I'm here with you. Did something happen today that brought this feeling up?`],
    hi: [`किसी को परवाह नहीं है ऐसा लगना बहुत अकेला कर सकता है। मैं आपके साथ हूँ। क्या आज कुछ हुआ जिससे यह feeling और तेज़ हो गई?`],
    mr: [`कोणालाच काळजी नाही असे वाटणे खूप एकटे पाडू शकते. मी तुमच्यासोबत आहे. आज असे काही घडले का ज्यामुळे ही भावना वाढली?`],
  },

  fear: {
    en: [
      `That sounds really scary. It makes sense that you feel that way. Do you want to tell me what happened — or what's making you feel afraid right now?`,
      `Being scared is exhausting. You don't have to pretend you're okay. What's been going on?`,
      `I can hear that you're frightened. You're safe to talk here. Want to tell me a little about what's been happening?`,
    ],
    hi: [
      `यह सुनकर डर लगता है। यह महसूस करना बिल्कुल स्वाभाविक है। क्या आप मुझे बताना चाहेंगे कि क्या हुआ — या अभी क्या आपको डरा रहा है?`,
      `डरे रहना थका देने वाला होता है। आपको ठीक होने का नाटक करने की ज़रूरत नहीं। क्या हो रहा है?`,
    ],
    mr: [
      `हे ऐकून भीती वाटते. असे वाटणे अगदी स्वाभाविक आहे. तुम्हाला काय झाले ते मला सांगायचे आहे का?`,
      `भीती वाटत राहणे थकवते. तुम्हाला ठीक असल्याचे भासवण्याची गरज नाही. काय होत आहे?`,
    ],
  },

  distress: {
    en: [
      `That sounds like a lot to carry. You don't have to have it all figured out — just talking about it can help a little. What's been weighing on you most?`,
      `I'm really sorry you're going through this. It doesn't have to stay this heavy forever. Can you tell me what's been going on?`,
      `Those feelings are real and valid. You're not weak for feeling this way. What's been happening in your life recently?`,
    ],
    hi: [
      `यह बहुत कुछ उठाना है। आपको सब कुछ समझना ज़रूरी नहीं — बस इसके बारे में बात करने से थोड़ी मदद हो सकती है। आपको सबसे ज़्यादा क्या परेशान कर रहा है?`,
      `मुझे खेद है कि आप इससे गुज़र रहे हैं। क्या हो रहा है, बता सकते हैं?`,
    ],
    mr: [
      `हे खूप सहन करण्यासारखे आहे. तुम्हाला सर्व काही समजलेले असणे गरजेचे नाही — फक्त बोलण्याने थोडी मदत होऊ शकते. तुम्हाला सर्वात जास्त काय त्रास देत आहे?`,
      `मला माफ करा की तुम्ही हे सहन करत आहात. काय होत आहे?`,
    ],
  },

  stress: {
    en: [
      `Sounds like today has been pretty intense. We can take this slowly — you don't have to solve everything at once. What's been causing the most pressure?`,
      `That's a lot to deal with. Want to tell me what's been going on? Sometimes just saying it out loud helps.`,
      `It sounds like things have been piling up. That's exhausting. What's been making things feel so overwhelming lately?`,
    ],
    hi: [
      `ऐसा लगता है आज काफी मुश्किल रहा। हम धीरे-धीरे आगे बढ़ सकते हैं — सब कुछ एक साथ सुलझाना ज़रूरी नहीं। सबसे ज़्यादा दबाव किस चीज़ का है?`,
      `बहुत कुछ है सामना करने के लिए। क्या हो रहा है बताना चाहेंगे? कभी-कभी ज़ोर से कह देने से मदद होती है।`,
    ],
    mr: [
      `असे वाटते आज खूप कठीण होते. आपण हळूहळू पुढे जाऊ शकतो — सर्वकाही एकत्र सोडवणे आवश्यक नाही. सर्वात जास्त दबाव कशाचा आहे?`,
      `खूप सामना करायचे आहे. काय होत आहे सांगाल का?`,
    ],
  },

  isolation: {
    en: [
      `Feeling alone is really hard — even when you're surrounded by people. You're not alone right now though. I'm here. What's been making you feel this way?`,
      `That kind of loneliness is painful. Is there something specific that happened, or has it been building for a while?`,
    ],
    hi: [
      `अकेलापन महसूस करना बहुत कठिन है — भले ही आप लोगों से घिरे हों। लेकिन अभी आप अकेले नहीं हैं। मैं यहाँ हूँ। आपको ऐसा क्यों लग रहा है?`,
      `यह अकेलापन दर्दनाक है। क्या कुछ हुआ, या धीरे-धीरे ऐसा होने लगा?`,
    ],
    mr: [
      `एकटेपणा जाणवणे खूप कठीण आहे — लोकांमध्ये असतानाही. पण आत्ता तुम्ही एकटे नाही. मी इथे आहे. तुम्हाला असे का वाटत आहे?`,
    ],
  },

  anxiety: {
    en: [
      `Anxiety can make everything feel ten times harder. Can you tell me what's been triggering it lately?`,
      `That restless, on-edge feeling is exhausting. What's been on your mind most?`,
    ],
    hi: [
      `चिंता हर चीज़ को दस गुना कठिन बना देती है। क्या आप बता सकते हैं हाल ही में क्या इसे trigger कर रहा है?`,
    ],
    mr: [
      `चिंता सर्वकाही दहापट कठीण बनवते. अलीकडे काय trigger करत आहे हे सांगू शकता का?`,
    ],
  },

  resources: {
    en: [
      `The Resources section has helplines, counselling contacts, and emergency support you can reach out to. Is there a specific kind of help you're looking for right now?`,
      `I can point you to support resources — helplines, counsellors, emergency contacts. What would be most helpful for you?`,
    ],
    hi: [
      `Resources सेक्शन में helplines, counselling contacts और emergency support हैं। अभी आप किस तरह की मदद ढूंढ रहे हैं?`,
    ],
    mr: [
      `Resources विभागात helplines, समुपदेशन संपर्क आणि आपत्कालीन आधार आहे. आत्ता तुम्हाला कोणत्या प्रकारची मदत हवी आहे?`,
    ],
  },

  counsellor: {
    en: [
      `Reaching out for support takes courage. You can request a counsellor from your dashboard or the Support section. Would you like me to guide you there?`,
      `That's a great step. A counsellor can offer support that goes beyond what I can provide. Head to the Support section when you're ready.`,
    ],
    hi: [
      `सहायता माँगने में हिम्मत लगती है। आप अपने dashboard से या Support सेक्शन से counsellor का अनुरोध कर सकते हैं।`,
    ],
    mr: [
      `आधार मागणे धाडसाचे आहे. तुम्ही तुमच्या dashboard वरून किंवा Support विभागातून समुपदेशकाची विनंती करू शकता.`,
    ],
  },

  positive: {
    en: [
      `That's good to hear. It takes real effort to stay grounded when things are hard. Is there anything on your mind you'd like to talk about?`,
      `Glad things feel a bit more okay today. Even good days can have things we want to talk through — anything on your mind?`,
    ],
    hi: [
      `यह सुनकर अच्छा लगा। कठिन समय में ठीक रहना असली मेहनत है। क्या कुछ है जो आप बात करना चाहेंगे?`,
    ],
    mr: [
      `हे ऐकून बरे वाटले. कठीण वेळी स्थिर राहणे खरी मेहनत आहे. काही मनात आहे का?`,
    ],
  },

  sleep: {
    en: [
      `Sleep issues are really common when stress builds up. Has something been keeping your mind busy at night?`,
      `Not sleeping well makes everything harder. Has this been going on for a while, or is it more recent?`,
    ],
    hi: [
      `नींद की समस्या तनाव बढ़ने पर आम है। क्या रात को कुछ आपके मन में चल रहा है?`,
    ],
    mr: [
      `झोपेच्या समस्या ताण वाढल्यावर सामान्य असतात. रात्री मनात काही चालू असते का?`,
    ],
  },

  // General contextual follow-ups — varied to avoid repetition
  general: [
    {
      en: `I'm here to listen. What's been on your mind lately?`,
      hi: `मैं सुनने के लिए यहाँ हूँ। हाल ही में क्या चल रहा है आपके मन में?`,
      mr: `मी ऐकण्यासाठी इथे आहे. अलीकडे तुमच्या मनात काय आहे?`,
    },
    {
      en: `That sounds like it's been weighing on you. How long has this been going on?`,
      hi: `ऐसा लगता है यह आप पर भारी पड़ रहा है। यह कब से हो रहा है?`,
      mr: `असे वाटते हे तुमच्यावर भार टाकत आहे. हे किती दिवसांपासून चालू आहे?`,
    },
    {
      en: `You don't have to have everything sorted out to talk about it. What feels most important right now?`,
      hi: `बात करने के लिए सब कुछ सुलझाना ज़रूरी नहीं। अभी क्या सबसे ज़रूरी लग रहा है?`,
      mr: `बोलण्यासाठी सर्वकाही सोडवणे आवश्यक नाही. आत्ता काय सर्वात महत्त्वाचे वाटते?`,
    },
    {
      en: `I hear you. Is there someone in your life you've been able to talk to about this?`,
      hi: `मैं समझ रहा/रही हूँ। क्या आपके जीवन में कोई है जिससे आप इस बारे में बात कर पाए हैं?`,
      mr: `मी समजतो/समजते. तुमच्या आयुष्यात असे कोणी आहे का ज्यांच्याशी तुम्ही याबद्दल बोलू शकलात?`,
    },
    {
      en: `How are things at home? Sometimes the space around us affects how we feel more than we realise.`,
      hi: `घर पर कैसी स्थिति है? कभी-कभी हमारे आसपास का माहौल हमें उससे ज़्यादा प्रभावित करता है जितना हम सोचते हैं।`,
      mr: `घरी कसे आहे? कधीकधी आपल्या आसपासची जागा आपल्याला वाटते त्यापेक्षा जास्त परिणाम करते.`,
    },
    {
      en: `You've had a lot going on. How have you been taking care of yourself — sleep, food, any breaks?`,
      hi: `आपके साथ बहुत कुछ हो रहा है। आप खुद का ख्याल कैसे रख रहे हैं — नींद, खाना, कोई आराम?`,
      mr: `तुमच्याकडे खूप काही चालू आहे. तुम्ही स्वतःची काळजी कशी घेत आहात — झोप, खाणे, कोणता विश्रांती?`,
    },
    {
      en: `Sometimes just saying things out loud helps us figure out what we're actually feeling. What's the thing that's been hardest to deal with?`,
      hi: `कभी-कभी बातें ज़ोर से कहने से हमें समझ आता है कि हम वास्तव में क्या महसूस कर रहे हैं। सबसे कठिन क्या रहा है सामना करना?`,
      mr: `कधीकधी गोष्टी मोठ्याने सांगण्याने आपल्याला समजते आपल्याला नक्की काय वाटत आहे. सर्वात कठीण काय होते?`,
    },
  ],

  greeting: {
    en: `Hi, I'm Sakha — your AI Dost. I'm here to listen, think things through with you, or simply keep you company. How are you feeling today?`,
    hi: `नमस्ते, मैं सखा हूँ — आपका AI Dost। मैं आपकी बात सुनने, साथ सोचने या बस आपका साथ देने के लिए यहाँ हूँ। आज आप कैसे हैं?`,
    mr: `नमस्कार, मी सखा — तुमचा AI Dost. तुमचे ऐकण्यासाठी, तुमच्यासोबत विचार करण्यासाठी किंवा फक्त सोबत राहण्यासाठी मी इथे आहे. आज तुम्हाला कसे वाटत आहे?`,
  },
};

// ─── Topic detection ───────────────────────────────────────────────────────────

function detectTopic(msg: string): string | null {
  const lower = msg.toLowerCase();

  if (CRITICAL_PHRASES.some(p => lower.includes(p))) return 'safety_critical';
  if (DANGER_PHRASES.some(p => lower.includes(p))) return 'immediate_danger';
  if (SAFETY_UNCLEAR_PHRASES.some(p => lower.includes(p)) && !/exam|course|test|study|work|project/.test(lower)) return 'safety_unclear';

  if (/failed|result|laughing at me|mock|exam went|cet/.test(lower)) return 'academic';
  if (/nobody cares|no one cares|everyone is against me|ignored|laughing at me|nobody|alone|lonely/.test(lower)) return 'rejection';

  if (/afraid|scared|terrified|fear|डर|भय|घाबर/.test(lower)) return 'fear';
  if (/hopeless|helpless|worthless|no point|nothing matters|pointless|निराश|दुखी|हताश/.test(lower)) return 'distress';
  if (/stress|overwhelm|too much|breaking|losing control|can't cope|cannot cope|exhausted|burnout|अभिभूत|थका/.test(lower)) return 'stress';
  if (/alone|lonely|isolated|no one|nobody|no friends|अकेला|एकटा/.test(lower)) return 'isolation';
  if (/anxious|anxiety|panic|nervous|restless|worry|worried|चिंता|घबराहट/.test(lower)) return 'anxiety';
  if (/can't sleep|insomnia|awake|sleep|नींद|झोप/.test(lower)) return 'sleep';
  if (/counsellor|counselor|therapist|support|help|talk to someone|काउंसलर|मदद/.test(lower)) return 'counsellor';
  if (/need advice|what should i|should i|how do i decide|help me decide|क्या करना चाहिए|सल्ला/.test(lower)) return 'advice';
  if (/resource|helpline|emergency|police|doctor|contact|संसाधन/.test(lower)) return 'resources';
  if (/okay|fine|good|better|alright|not bad|doing well|ठीक|अच्छा|बरे/.test(lower)) return 'positive';

  return null;
}

// ─── Helper to pick variant without exact repetition ─────────────────────────

function pickVariant(variants: string[], turnCount: number): string {
  return variants[turnCount % variants.length];
}

// ─── Main response generator ──────────────────────────────────────────────────

export function generateResponse(
  userMessage: string,
  history: ConvMessage[],
  language: Language,
): ConvResponse {
  const topic = detectTopic(userMessage);
  const isSafetyCritical = topic === 'safety_critical' || topic === 'immediate_danger';
  const userTurns = history.filter(m => m.role === 'user').length;

  let text: string;
  let hasFollowUp = true;

  const lang = language as 'en' | 'hi' | 'mr';
  const contextual = contextualResponse(userMessage, history, language);

  if (contextual) {
    return { text: contextual, isSafetyCritical, hasFollowUp: false, detectedTopic: topic ?? 'contextual' };
  }

  if (topic === 'safety_critical') {
    const variants = RESPONSE_VARIANTS.safety_critical[lang] ?? RESPONSE_VARIANTS.safety_critical.en;
    text = pickVariant(variants, userTurns);
    hasFollowUp = false;
  } else if (topic === 'safety_unclear') {
    const variants = RESPONSE_VARIANTS.safety_unclear[lang] ?? RESPONSE_VARIANTS.safety_unclear.en;
    text = pickVariant(variants, userTurns);
    hasFollowUp = false;
  } else if (topic === 'immediate_danger') {
    const variants = RESPONSE_VARIANTS.immediate_danger[lang] ?? RESPONSE_VARIANTS.immediate_danger.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'fear') {
    const variants = RESPONSE_VARIANTS.fear[lang] ?? RESPONSE_VARIANTS.fear.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'distress') {
    const variants = RESPONSE_VARIANTS.distress[lang] ?? RESPONSE_VARIANTS.distress.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'advice') {
    const variants = RESPONSE_VARIANTS.advice[lang] ?? RESPONSE_VARIANTS.advice.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'academic') {
    const variants = RESPONSE_VARIANTS.academic[lang] ?? RESPONSE_VARIANTS.academic.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'rejection') {
    const variants = RESPONSE_VARIANTS.rejection[lang] ?? RESPONSE_VARIANTS.rejection.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'stress') {
    const variants = RESPONSE_VARIANTS.stress[lang] ?? RESPONSE_VARIANTS.stress.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'isolation') {
    const variants = RESPONSE_VARIANTS.isolation[lang] ?? RESPONSE_VARIANTS.isolation.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'anxiety') {
    const variants = RESPONSE_VARIANTS.anxiety[lang] ?? RESPONSE_VARIANTS.anxiety.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'sleep') {
    const variants = RESPONSE_VARIANTS.sleep[lang] ?? RESPONSE_VARIANTS.sleep.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'counsellor') {
    const variants = RESPONSE_VARIANTS.counsellor[lang] ?? RESPONSE_VARIANTS.counsellor.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'resources') {
    const variants = RESPONSE_VARIANTS.resources[lang] ?? RESPONSE_VARIANTS.resources.en;
    text = pickVariant(variants, userTurns);
  } else if (topic === 'positive') {
    const variants = RESPONSE_VARIANTS.positive[lang] ?? RESPONSE_VARIANTS.positive.en;
    text = pickVariant(variants, userTurns);
  } else {
    // Context-aware general: cycle through responses based on turn count
    const pool = RESPONSE_VARIANTS.general;
    const entry = pool[userTurns % pool.length];
    text = entry[lang] ?? entry.en;
  }

  return { text, isSafetyCritical, hasFollowUp, detectedTopic: topic ?? 'general' };
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

export function getGreeting(language: Language): string {
  const lang = language as 'en' | 'hi' | 'mr';
  return RESPONSE_VARIANTS.greeting[lang] ?? RESPONSE_VARIANTS.greeting.en;
}

// ─── Stress Scale response generator ──────────────────────────────────────────

export function getStressScaleResponse(level: number, language: Language): string {
  const lang = language as 'en' | 'hi' | 'mr';

  const responses: Record<'en' | 'hi' | 'mr', Record<string, string>> = {
    en: {
      low: `Looks like you're in a fairly calm place today. That's good. Want to tell me how your day has been going?`,
      mild: `Sounds like there's a little something on your mind. That's okay. Want to talk about what's been going on?`,
      moderate: `A moderate amount of stress can build up over time. You don't have to deal with it alone. What's been weighing on you most lately?`,
      high: `That sounds like a really heavy load right now. We don't have to solve everything at once — let's just take one thing at a time. What's causing the most pressure?`,
      very_high: `That sounds like a really intense moment. I'm here with you. You don't have to explain everything perfectly. Just tell me what's on your mind.`,
    },
    hi: {
      low: `ऐसा लगता है आप आज काफी शांत हैं। यह अच्छी बात है। क्या आप बताना चाहेंगे आज का दिन कैसा रहा?`,
      mild: `ऐसा लगता है मन में कुछ चल रहा है। कोई बात नहीं। क्या हो रहा है, बात करना चाहेंगे?`,
      moderate: `थोड़ा-थोड़ा तनाव समय के साथ बढ़ सकता है। इसे अकेले झेलना ज़रूरी नहीं। हाल में सबसे ज़्यादा क्या परेशान कर रहा है?`,
      high: `यह सुनकर लग रहा है आप पर काफी बोझ है। हमें सब एक साथ नहीं सुलझाना — एक-एक चीज़ लेते हैं। सबसे ज़्यादा दबाव किस चीज़ का है?`,
      very_high: `यह सुनकर लग रहा है यह बहुत कठिन पल है। मैं आपके साथ हूँ। सब कुछ सही से समझाने की ज़रूरत नहीं। बस बताइए क्या चल रहा है।`,
    },
    mr: {
      low: `असे दिसते की आज तुम्ही बऱ्यापैकी शांत आहात. हे चांगले आहे. तुमचा दिवस कसा गेला सांगाल का?`,
      mild: `असे वाटते की मनात थोडे काहीतरी आहे. ठीक आहे. काय चालू आहे याबद्दल बोलायचे आहे का?`,
      moderate: `थोडा थोडा ताण वेळाने वाढू शकतो. त्याला एकट्याने सामोरे जाण्याची गरज नाही. अलीकडे तुम्हाला सर्वात जास्त काय त्रास देत आहे?`,
      high: `हे ऐकून वाटते तुमच्यावर खूप ओझे आहे. आपल्याला सर्व एकत्र सोडवायचे नाही — एक-एक गोष्ट घेऊ. सर्वात जास्त दबाव कशाचा आहे?`,
      very_high: `हे ऐकून वाटते हा खूप कठीण क्षण आहे. मी तुमच्यासोबत आहे. सर्वकाही परिपूर्णपणे समजावण्याची गरज नाही. फक्त सांगा मनात काय आहे.`,
    },
  };

  const r = responses[lang] ?? responses.en;
  if (level <= 2) return r.low;
  if (level <= 4) return r.mild;
  if (level <= 6) return r.moderate;
  if (level <= 8) return r.high;
  return r.very_high;
}

// ─── Assessment follow-up questions ───────────────────────────────────────────

interface AdaptiveQuestion {
  question: string;
  context: string;
}

const ADAPTIVE_QUESTIONS: Record<Language, AdaptiveQuestion[]> = {
  en: [
    { context: 'opening', question: `Thank you for being here. How are you feeling right now? Take your time — there's no rush.` },
    { context: 'safety', question: `Do you feel safe where you are right now? You don't need to share your location — just let me know if anything feels unsafe.` },
    { context: 'support', question: `Is there someone you trust — a family member, a friend, or anyone — that you've been able to talk to about how you've been feeling?` },
    { context: 'recent_events', question: `Have you been through anything recently that was really difficult or upsetting for you?` },
    { context: 'physical', question: `How have you been sleeping and eating lately? Sometimes our body tells us how much we're carrying.` },
    { context: 'needs', question: `Is there something specific you'd like help with today? Even if you're not sure, that's okay.` },
    { context: 'closing', question: `Thank you for sharing all of this with me. Before we finish, is there anything else you'd like to add?` },
  ],
  hi: [
    { context: 'opening', question: `यहाँ आने के लिए शुक्रिया। आप अभी कैसा महसूस कर रहे हैं? कोई जल्दी नहीं है।` },
    { context: 'safety', question: `क्या आप अभी जहाँ हैं वहाँ सुरक्षित महसूस कर रहे हैं? स्थान बताने की ज़रूरत नहीं — बस बताएँ अगर कुछ असुरक्षित लगे।` },
    { context: 'support', question: `क्या कोई ऐसा व्यक्ति है जिस पर आप भरोसा करते हैं — परिवार, दोस्त, कोई भी — जिससे आप अपनी भावनाओं के बारे में बात कर पाए हैं?` },
    { context: 'recent_events', question: `क्या हाल ही में कुछ ऐसा हुआ जो आपके लिए सच में मुश्किल या परेशान करने वाला रहा?` },
    { context: 'physical', question: `हाल में आपकी नींद और खाना-पीना कैसा रहा है? कभी-कभी हमारा शरीर बताता है कि हम कितना बोझ उठा रहे हैं।` },
    { context: 'needs', question: `क्या आज कुछ ऐसा है जिसमें आप मदद चाहते हैं? अगर आप sure नहीं हैं, तो कोई बात नहीं।` },
    { context: 'closing', question: `इतना सब share करने के लिए शुक्रिया। खत्म करने से पहले, क्या कुछ और जोड़ना चाहेंगे?` },
  ],
  mr: [
    { context: 'opening', question: `इथे येण्याबद्दल धन्यवाद. तुम्हाला आत्ता कसे वाटत आहे? घाई नाही.` },
    { context: 'safety', question: `तुम्ही आत्ता जिथे आहात तिथे सुरक्षित वाटत आहे का? ठिकाण सांगण्याची गरज नाही — फक्त सांगा काही असुरक्षित वाटत असेल तर.` },
    { context: 'support', question: `असे कोणी आहे का ज्यावर तुम्ही विश्वास ठेवता — कुटुंब, मित्र, कोणीही — ज्यांच्याशी तुम्ही तुमच्या भावनांबद्दल बोलू शकलात?` },
    { context: 'recent_events', question: `अलीकडे तुमच्यासोबत असे काही घडले आहे का जे खरोखरच कठीण किंवा त्रासदायक होते?` },
    { context: 'physical', question: `अलीकडे तुमची झोप आणि खाणे-पिणे कसे आहे? कधीकधी आपले शरीर सांगते आपण किती सहन करत आहोत.` },
    { context: 'needs', question: `आज असे काही आहे का ज्यात तुम्हाला मदत हवी आहे? जरी तुम्हाला खात्री नसेल, तरी ठीक आहे.` },
    { context: 'closing', question: `हे सर्व सांगितल्याबद्दल धन्यवाद. संपवण्यापूर्वी, काही जोडायचे आहे का?` },
  ],
};

export function getAdaptiveQuestion(
  questionIndex: number,
  language: Language,
  userResponse: string,
): string {
  const questions = ADAPTIVE_QUESTIONS[language];
  const lower = userResponse.toLowerCase();
  if (DANGER_PHRASES.some(p => lower.includes(p)) && questionIndex < 2) {
    return questions[1].question;
  }
  const idx = Math.min(questionIndex, questions.length - 1);
  return questions[idx].question;
}

export function getTotalAdaptiveQuestions(): number {
  return ADAPTIVE_QUESTIONS.en.length;
}
