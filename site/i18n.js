/* Translations. Static text: elements with data-i18n="key" (text), data-i18n-ph (placeholder), data-i18n-html (rich text).
   Generated sentences: I18N.t("key", {vars}). English is the fallback for anything not yet translated.
   To add a language: copy the "hi" block, translate every value, add it to LANGS and to FONTS if it needs another script. */
(() => {
  "use strict";
  const LANGS = { en: "English", hi: "हिन्दी" };
  const FONTS = { hi: "IBM+Plex+Sans+Devanagari:wght@400;500;600" };
  const EN = {
    "head.none": "No tropical cyclones are active anywhere right now.",
    "head.one": "One tropical cyclone is active: {name}, {a} {cls} {where}.",
    "head.many": "{n} tropical cyclones are active. The strongest is {name}, {where}.",
    "sub.inv1": "One more developing system is being watched and could become a cyclone.",
    "sub.invN": "{n} more developing systems are being watched and could become cyclones.",
    "updated": "Updated {t} from NOAA's GFS model and the latest official advisories.",
    "empty": "Nothing to show today. Past storms are in Storm analysis, under Archive.",
    "where.ocean": "over the open ocean", "where.fmt": "{d} {dir} of {town}, {country}",
    "dir.north": "north", "dir.north-east": "north-east", "dir.east": "east", "dir.south-east": "south-east",
    "dir.south": "south", "dir.south-west": "south-west", "dir.west": "west", "dir.north-west": "north-west",
    "mv.still": "Almost stationary", "mv.fmt": "Moving {dir} at {v} km/h", "sw.rapid": " and strengthening rapidly", "sw.up": " and strengthening", "sw.down": " and weakening",
    "row.winds": "km/h winds", "row.invest": ", not yet named or numbered", "btn.map": "Show on live map", "btn.analysis": "Open storm analysis", "km": "km",
    "cls.hurricane": "Hurricane", "cls.typhoon": "Typhoon", "cls.stc": "Severe tropical cyclone", "cls.cat": "category {n}",
    "place.finding": "Finding your location…", "place.nogeo": "Your browser cannot share its location. Choose a town instead.",
    "place.denied": "Location was not shared. Choose a town from the list instead.", "place.you": "your location",
    "place.none": "No tropical cyclone is active anywhere. Nothing is heading for {place}.", "place.updates": "This page updates several times a day.",
    "place.clear": "No cyclone is expected near {place} in the next five days.", "place.may": "{name} may pass about {d} from {place} {when}.",
    "place.is": "{name} is {d} from {place}.", "place.day1": "in about 1 day", "place.days": "in about {n} days",
    "place.red": "This is close enough for dangerous wind, rain and sea. Follow {ag} now and be ready to move to a shelter.",
    "place.orange": "Heavy rain, strong wind and rough sea are possible. Watch the bulletins of {ag} closely.",
    "place.yellow": "It is still far away, but forecasts can change. Check again tomorrow and follow {ag}.",
    "place.green": "The nearest storm, {name}, is {d} away.", "place.green.fc": "The nearest storm, {name}, is {d} away and is not forecast to come within 600 km.",
    "place.official": "Official warnings:", "place.note.fc": "Based on the average of 31 GFS ensemble forecasts. Distances are to the storm's centre; its winds and rain reach hundreds of kilometres further.",
    "place.note": "Distances are to the storm's centre; its winds and rain reach hundreds of kilometres further.",
    "map.time": "Weather from NOAA's GFS analysis of {t}.", "map.notyet": "Weather layers appear after the next update of the site.",
    "lv.surface": "Near the surface (10 m)", "lv.fmt": "{p} hPa, {info}",
    "lv.850": "about 1.5 km up", "lv.700": "about 3 km up", "lv.500": "about 5.5 km up", "lv.300": "about 9 km up", "lv.200": "about 12 km up",
    "cont.p": "Pressure: isobars, highs and lows", "cont.h": "Height of this level: troughs and ridges",
    "lg.flow": "Wind speed: colour of the moving lines", "lg.both": "Wind speed: moving lines and background colour",
    "lg.pwat": "Water vapour in the whole air column", "lg.rh": "Relative humidity at this height", "lg.sst": "Sea surface temperature. Dashed line: 26.5 °C, warm enough for cyclones",
    "lg.iso": "White lines: sea-level pressure every 4 hPa. H high, L low.", "lg.hgt": "White lines: height of the {p} hPa level every {s} m. L trough, H ridge.",
    "lg.3d": "Heights are exaggerated about {x} times so the levels can be seen.",
    "rd.surface": "Near the surface", "rd.at": "At {p} hPa ({info})", "rd.wind": "wind {v} km/h from the {dir}", "rd.rh": "humidity {v}%", "rd.hgt": "level height {v} m",
    "rd.nowind": "No wind data here.", "rd.mslp": "sea-level pressure {v} hPa", "rd.pwat": "water vapour {v} mm", "rd.sst": "sea temperature {v} °C", "rd.warm": " (warm enough for cyclones)",
    "v.3d": "3D globe", "v.2d": "Flat map", "v.stack": "All heights at once (3D vortex)", "v.2donly": "Circulation overlays are shown on the flat map.",
    "tm.now": "Now", "tm.yday": "Yesterday", "tm.ago": "{n} days ago", "tm.in1": "In 1 day", "tm.in": "In {n} days", "tm.fc": "forecast", "tm.an": "analysis",
    "rd.tmp": "temperature {v} °C", "rd.vort": "vorticity {v} ×10⁻⁵ s⁻¹", "rd.cape": "thunderstorm energy (CAPE) {v} J/kg", "rd.rain": "rain {v} mm in 6 h",
    "lg.tmp": "Temperature at this height", "lg.vort": "Spin of the air (relative vorticity). Red spins anticlockwise, like Northern Hemisphere lows",
    "lg.shear": "Wind shear between 850 and 200 hPa. Under about 10 m/s favours cyclones", "lg.cape": "Thunderstorm energy (CAPE)", "lg.rain": "Rain in the 6 hours before this time (forecasts only)",
    "tc.h": "Next five days in {town}", "tc.rain": "Rain", "tc.wind": "Strongest wind", "tc.sea": "Sea", "tc.boats": "Small boats", "tc.nogo": "Not safe", "tc.ok": "Usually fine",
    "tc.note": "From NOAA's GFS weather and wave models, for 24-hour periods. Fishers must follow official warnings.", "tc.wavept": "Sea state is for the nearest sea point, {km} km away.",
    "rn.none": "dry or very light", "rn.light": "light", "rn.mod": "moderate", "rn.heavy": "heavy", "rn.vheavy": "very heavy", "rn.xheavy": "extremely heavy",
    "sea.calm": "calm or smooth", "sea.slight": "slight", "sea.mod": "moderate", "sea.rough": "rough", "sea.vrough": "very rough", "sea.high": "high", "sea.vhigh": "very high",
    "unit.kmh": "km/h",
    "lg.hs": "Significant wave height (NOAA WaveWatch III)", "lg.curspd": "Ocean surface current speed (NOAA RTOFS)", "lg.flwaves": "Moving lines: direction waves travel, coloured by wave height",
    "lg.flcur": "Moving lines: ocean surface currents (sped up to be visible), coloured by speed", "rd.hs": "waves {v} m, travelling {dir}", "rd.cur": "current {v} m/s towards the {dir}",
    "oc.h": "Ocean currents and gyres", "oc.p": "Winds drive five great loops of surface currents, the gyres: clockwise in the Northern Hemisphere and anticlockwise in the Southern. On their western sides run fast, warm currents carrying tropical heat poleward (red: Gulf Stream, Kuroshio, Agulhas, Brazil, East Australian); on their eastern sides, slower cold currents flow towards the equator (blue: Canary, California, Benguela, Humboldt) with upwelling of cold, nutrient-rich water. Cold currents from the poles, like the Labrador and Oyashio, meet the warm ones. In the Indian Ocean the monsoon reverses the Somali Current twice a year. Warm currents can feed cyclones; a storm's own winds also mix and cool the sea behind it. Choose “Ocean surface currents” under Moving lines to see today's flow from NOAA's ocean model.",
    "sd.fc": "Where it is forecast to be (GEFS ensemble mean)", "sd.towns": "Coastal towns it may come closest to", "sd.closest": "closest about {d}, in about {n} day(s)",
    "sd.ri": "Chance of rapid strengthening in the next 24 hours:", "sd.typical": "typical storm: {p}%", "sd.hidefc": "Hide forecast tracks", "sd.showfc": "Show forecast tracks",
    "sd.centre": "Centre on it", "tc.none": "No forecast for this town yet.", "tc.mine": "Make this my town",
  };
  const HI = {
    // navigation and static text
    "nav.today": "आज", "nav.map": "लाइव मानचित्र", "nav.analysis": "तूफ़ान विश्लेषण", "nav.learn": "जानें", "search.ph": "तूफ़ान, बेसिन या वर्ष खोजें",
    "place.h": "क्या कोई चक्रवात आपकी ओर आ रहा है?", "place.p": "अपना शहर चुनें, या ब्राउज़र को आपकी जगह पता करने दें। आपकी जगह केवल इसी डिवाइस पर रहती है।",
    "place.geo": "मेरी लोकेशन इस्तेमाल करें", "place.choose": "शहर चुनें…", "st.h": "अभी सक्रिय तूफ़ान",
    "pr.h": "तैयार रहें", "pr.p": "सामान्य मार्गदर्शन। हमेशा अपनी राष्ट्रीय मौसम सेवा और स्थानीय प्रशासन के निर्देशों का पालन करें।",
    "pr.h1": "जब चक्रवात आने की संभावना हो", "pr.1a": "रेडियो, टीवी या मौसम विभाग के ऐप पर आधिकारिक बुलेटिन देखते रहें।",
    "pr.1b": "तीन दिन के लिए पीने का पानी, खाना, दवाइयाँ, टॉर्च, पावर बैंक और ज़रूरी दस्तावेज़ों की प्रतियाँ तैयार रखें।",
    "pr.1c": "अपने निकटतम चक्रवात आश्रय और वहाँ पहुँचने का सुरक्षित रास्ता जान लें।", "pr.1d": "तेज़ हवा में उड़ सकने वाली ढीली चीज़ों को बाँध दें या अंदर रख लें।",
    "pr.h2": "जब चेतावनी जारी हो", "pr.2a": "अगर आप समुद्र के पास, निचले इलाके में या कमज़ोर मकान में रहते हैं, तो समय रहते आश्रय या मज़बूत इमारत में चले जाएँ।",
    "pr.2b": "मछुआरे समुद्र में न जाएँ और बंदरगाह लौट आएँ।", "pr.2c": "घर के अंदर रहें, खिड़कियों से दूर। अचानक शांति तूफ़ान की आँख हो सकती है: हवा फिर दूसरी दिशा से लौटेगी।",
    "pr.2d": "अगर पानी घुसने का खतरा हो तो बिजली और गैस बंद कर दें।", "pr.h3": "तूफ़ान गुज़रने के बाद", "pr.3a": "बाहर निकलने से पहले प्रशासन की ओर से सुरक्षित होने की सूचना का इंतज़ार करें।",
    "pr.3b": "गिरे हुए बिजली के तारों, बाढ़ के पानी और क्षतिग्रस्त इमारतों से दूर रहें।", "pr.3c": "केवल उबला या शुद्ध किया हुआ पानी पिएँ।", "pr.3d": "बुज़ुर्ग पड़ोसियों और अकेले रहने वालों का हालचाल लें।",
    "ab.h": "यह साइट क्या है",
    "ab.p1": "यह एक शोध परियोजना है जो पृथ्वी के हर उष्णकटिबंधीय चक्रवात पर नज़र रखती है। इसे NOAA के GFS मौसम मॉडल और आधिकारिक तूफ़ान सूचनाओं से दिन में कई बार अपडेट किया जाता है। <a href=\"#map\">लाइव मानचित्र</a> उन हवाओं, दबाव, नमी और समुद्र के तापमान को दिखाता है जो तूफ़ानों को दिशा और ऊर्जा देते हैं। <a href=\"#storms\">तूफ़ान विश्लेषण</a> में हर तूफ़ान की 3D संरचना, उसका वातावरण और प्रभाव का अनुमान है। <a href=\"#learn\">जानें</a> में सब कुछ समझाया गया है।",
    "ab.p2": "यह कोई आधिकारिक चेतावनी सेवा नहीं है। चेतावनियों के लिए अपनी राष्ट्रीय मौसम सेवा देखें।",
    "ly.h": "परतें", "ly.wind": "हवा का प्रवाह", "ly.storms": "उष्णकटिबंधीय चक्रवात", "ly.colour": "मानचित्र का रंग", "ly.speed": "हवा की गति", "ly.pwat": "हवा में जलवाष्प",
    "ly.rh": "इस ऊँचाई पर आर्द्रता", "ly.sst": "समुद्र सतह का तापमान", "ly.none": "कुछ नहीं", "ly.explain": "वायुमंडलीय परिसंचरण समझें",
    "ov.cells": "हैडली, फ़ेरल और ध्रुवीय कोशिकाएँ", "ov.walker": "वॉकर परिसंचरण", "ov.nino": "एल नीनो और हिंद महासागर द्विध्रुव क्षेत्र", "lv.label": "वायुमंडल में ऊँचाई",
    "learn.h": "वायुमंडल उष्णकटिबंधीय चक्रवात कैसे बनाता और चलाता है", "learn.lede": "पाँच छोटी व्याख्याएँ, हर एक आज के लाइव मानचित्र से जुड़ी हुई। विस्तृत पाठ अभी अंग्रेज़ी में है।",
    "learn.h1": "तीन परिसंचरण कोशिकाएँ", "learn.h2": "वॉकर परिसंचरण, एल नीनो और हिंद महासागर द्विध्रुव", "learn.h3": "उष्णकटिबंधीय चक्रवात को क्या चाहिए", "learn.h4": "यह कितना शक्तिशाली है?", "learn.h5": "लाइव मानचित्र कैसे पढ़ें",
    "ftr": "GlobalTCView, देवाशीष, आईआईटी हैदराबाद। डेटा: NOAA GFS और NCEP TCVitals, NASA, IBTrACS, GHSL, विश्व बैंक। ओपन सोर्स।",
    // generated sentences
    "head.none": "इस समय दुनिया में कहीं भी कोई उष्णकटिबंधीय चक्रवात सक्रिय नहीं है।",
    "head.one": "एक उष्णकटिबंधीय चक्रवात सक्रिय है: {name}, एक {cls}, {where}।",
    "head.many": "{n} उष्णकटिबंधीय चक्रवात सक्रिय हैं। सबसे शक्तिशाली {name} है, {where}।",
    "sub.inv1": "एक और विकसित हो रहे तंत्र पर नज़र रखी जा रही है, जो चक्रवात बन सकता है।", "sub.invN": "{n} और विकसित हो रहे तंत्रों पर नज़र रखी जा रही है, जो चक्रवात बन सकते हैं।",
    "updated": "{t} को NOAA के GFS मॉडल और नवीनतम आधिकारिक सूचनाओं से अपडेट किया गया।", "empty": "आज दिखाने के लिए कुछ नहीं है। पुराने तूफ़ान तूफ़ान विश्लेषण के संग्रह में हैं।",
    "where.ocean": "खुले समुद्र के ऊपर", "where.fmt": "{town}, {country} से {d} {dir} में",
    "dir.north": "उत्तर", "dir.north-east": "उत्तर-पूर्व", "dir.east": "पूर्व", "dir.south-east": "दक्षिण-पूर्व", "dir.south": "दक्षिण", "dir.south-west": "दक्षिण-पश्चिम", "dir.west": "पश्चिम", "dir.north-west": "उत्तर-पश्चिम",
    "mv.still": "लगभग स्थिर", "mv.fmt": "{dir} की ओर {v} किमी/घंटा की गति से बढ़ रहा है", "sw.rapid": " और तेज़ी से शक्तिशाली हो रहा है", "sw.up": " और शक्तिशाली हो रहा है", "sw.down": " और कमज़ोर हो रहा है",
    "row.winds": "किमी/घंटा हवाएँ", "row.invest": ", अभी नाम या संख्या नहीं दी गई", "btn.map": "लाइव मानचित्र पर दिखाएँ", "btn.analysis": "तूफ़ान विश्लेषण खोलें", "km": "किमी",
    "Depression": "अवदाब", "Deep Depression": "गहरा अवदाब", "Cyclonic Storm": "चक्रवाती तूफ़ान", "Severe Cyclonic Storm": "गंभीर चक्रवाती तूफ़ान",
    "Very Severe Cyclonic Storm": "अति गंभीर चक्रवाती तूफ़ान", "Extremely Severe Cyclonic Storm": "अत्यंत गंभीर चक्रवाती तूफ़ान", "Super Cyclonic Storm": "सुपर चक्रवाती तूफ़ान",
    "Low pressure area": "कम दबाव का क्षेत्र", "Tropical storm": "उष्णकटिबंधीय तूफ़ान", "Tropical depression": "उष्णकटिबंधीय अवदाब",
    "cls.hurricane": "हरिकेन", "cls.typhoon": "टाइफ़ून", "cls.stc": "गंभीर उष्णकटिबंधीय चक्रवात", "cls.cat": "श्रेणी {n}",
    "place.finding": "आपकी जगह पता की जा रही है…", "place.nogeo": "आपका ब्राउज़र जगह साझा नहीं कर सकता। कृपया शहर चुनें।", "place.denied": "जगह साझा नहीं की गई। सूची से शहर चुनें।", "place.you": "आपकी जगह",
    "place.none": "कहीं भी कोई उष्णकटिबंधीय चक्रवात सक्रिय नहीं है। {place} की ओर कुछ नहीं आ रहा।", "place.updates": "यह पेज दिन में कई बार अपडेट होता है।",
    "place.clear": "अगले पाँच दिनों में {place} के पास किसी चक्रवात की संभावना नहीं है।", "place.may": "{name} {when} {place} से लगभग {d} की दूरी से गुज़र सकता है।",
    "place.is": "{name} {place} से {d} दूर है।", "place.day1": "लगभग 1 दिन में", "place.days": "लगभग {n} दिनों में",
    "place.red": "यह खतरनाक हवा, बारिश और समुद्री लहरों के लिए काफ़ी पास है। अभी {ag} के निर्देशों का पालन करें और आश्रय में जाने के लिए तैयार रहें।",
    "place.orange": "भारी बारिश, तेज़ हवा और उग्र समुद्र संभव हैं। {ag} के बुलेटिन ध्यान से देखते रहें।",
    "place.yellow": "यह अभी दूर है, पर पूर्वानुमान बदल सकते हैं। कल फिर देखें और {ag} के निर्देशों का पालन करें।",
    "place.green": "सबसे निकट तूफ़ान, {name}, {d} दूर है।", "place.green.fc": "सबसे निकट तूफ़ान, {name}, {d} दूर है और इसके 600 किमी के भीतर आने का पूर्वानुमान नहीं है।",
    "place.official": "आधिकारिक चेतावनियाँ:", "place.note.fc": "31 GFS समूह पूर्वानुमानों के औसत पर आधारित। दूरी तूफ़ान के केंद्र तक है; इसकी हवाएँ और बारिश सैकड़ों किलोमीटर आगे तक पहुँचती हैं।",
    "place.note": "दूरी तूफ़ान के केंद्र तक है; इसकी हवाएँ और बारिश सैकड़ों किलोमीटर आगे तक पहुँचती हैं।",
    "map.time": "NOAA के GFS विश्लेषण ({t}) से मौसम।", "map.notyet": "साइट के अगले अपडेट के बाद मौसम की परतें दिखेंगी।",
    "lv.surface": "सतह के पास (10 मी)", "lv.fmt": "{p} hPa, {info}", "lv.850": "लगभग 1.5 किमी ऊपर", "lv.700": "लगभग 3 किमी ऊपर", "lv.500": "लगभग 5.5 किमी ऊपर", "lv.300": "लगभग 9 किमी ऊपर", "lv.200": "लगभग 12 किमी ऊपर",
    "cont.p": "दबाव: समदाब रेखाएँ, उच्च और निम्न", "cont.h": "इस स्तर की ऊँचाई: ट्रफ़ और रिज",
    "lg.flow": "हवा की गति: चलती रेखाओं का रंग", "lg.both": "हवा की गति: चलती रेखाएँ और पृष्ठभूमि का रंग", "lg.pwat": "पूरे वायु स्तंभ में जलवाष्प", "lg.rh": "इस ऊँचाई पर सापेक्ष आर्द्रता",
    "lg.sst": "समुद्र सतह का तापमान। टूटी रेखा: 26.5 °C, चक्रवात के लिए पर्याप्त गर्म", "lg.iso": "सफ़ेद रेखाएँ: हर 4 hPa पर समुद्र-तल दबाव। H उच्च, L निम्न।",
    "lg.hgt": "सफ़ेद रेखाएँ: {p} hPa स्तर की ऊँचाई, हर {s} मी पर। L ट्रफ़, H रिज।", "lg.3d": "स्तरों को दिखाने के लिए ऊँचाई लगभग {x} गुना बढ़ाकर दिखाई गई है।",
    "rd.surface": "सतह के पास", "rd.at": "{p} hPa पर ({info})", "rd.wind": "{dir} से {v} किमी/घंटा हवा", "rd.rh": "आर्द्रता {v}%", "rd.hgt": "स्तर की ऊँचाई {v} मी",
    "rd.nowind": "यहाँ हवा का डेटा नहीं है।", "rd.mslp": "समुद्र-तल दबाव {v} hPa", "rd.pwat": "जलवाष्प {v} मिमी", "rd.sst": "समुद्र का तापमान {v} °C", "rd.warm": " (चक्रवात के लिए पर्याप्त गर्म)",
"ly.tmp": "इस ऊँचाई पर तापमान", "ly.vort": "हवा का घूमना (वॉर्टिसिटी)", "ly.shear": "पवन अपरूपण (शियर), 850–200 hPa", "ly.cape": "आँधी-तूफ़ान की ऊर्जा (CAPE)", "ly.rain": "6 घंटे की बारिश (पूर्वानुमान)",
    "tm.now": "अभी", "tm.yday": "कल (बीता हुआ)", "tm.ago": "{n} दिन पहले", "tm.in1": "1 दिन बाद", "tm.in": "{n} दिन बाद", "tm.fc": "पूर्वानुमान", "tm.an": "विश्लेषण",
    "rd.tmp": "तापमान {v} °C", "rd.vort": "वॉर्टिसिटी {v} ×10⁻⁵ s⁻¹", "rd.cape": "आँधी-तूफ़ान की ऊर्जा (CAPE) {v} J/kg", "rd.rain": "6 घंटे में {v} मिमी बारिश",
    "lg.tmp": "इस ऊँचाई पर तापमान", "lg.vort": "हवा का घूमना (सापेक्ष वॉर्टिसिटी)। लाल: वामावर्त, उत्तरी गोलार्ध के निम्न दबाव की तरह",
    "lg.shear": "850 और 200 hPa के बीच पवन अपरूपण। लगभग 10 m/s से कम चक्रवात के लिए अनुकूल", "lg.cape": "आँधी-तूफ़ान की ऊर्जा (CAPE)", "lg.rain": "इस समय से पहले के 6 घंटों में बारिश (केवल पूर्वानुमान)",
    "tc.h": "{town} में अगले पाँच दिन", "tc.rain": "बारिश", "tc.wind": "सबसे तेज़ हवा", "tc.sea": "समुद्र", "tc.boats": "छोटी नावें", "tc.nogo": "सुरक्षित नहीं", "tc.ok": "आम तौर पर ठीक",
    "tc.note": "NOAA के GFS मौसम और लहर मॉडल से, 24-घंटे की अवधि के लिए। मछुआरे आधिकारिक चेतावनियों का पालन करें।", "tc.wavept": "समुद्र की स्थिति {km} किमी दूर के निकटतम समुद्री बिंदु की है।",
    "rn.none": "सूखा या बहुत हल्की", "rn.light": "हल्की", "rn.mod": "मध्यम", "rn.heavy": "भारी", "rn.vheavy": "बहुत भारी", "rn.xheavy": "अत्यंत भारी",
    "sea.calm": "शांत", "sea.slight": "हल्की लहरें", "sea.mod": "मध्यम", "sea.rough": "उग्र", "sea.vrough": "बहुत उग्र", "sea.high": "ऊँची लहरें", "sea.vhigh": "बहुत ऊँची लहरें",
    "unit.kmh": "किमी/घंटा",
    "fl.h": "चलती रेखाएँ दिखाएँ", "fl.wind": "इस ऊँचाई पर हवा", "fl.waves": "समुद्री लहरें (चलने की दिशा)", "fl.currents": "समुद्र की सतह की धाराएँ", "ly.hs": "समुद्री लहरों की ऊँचाई", "ly.curspd": "समुद्री धारा की गति",
    "ov.ocean": "समुद्री धाराएँ और गायर", "lg.hs": "लहरों की महत्वपूर्ण ऊँचाई (NOAA WaveWatch III)", "lg.curspd": "समुद्र की सतह पर धारा की गति (NOAA RTOFS)", "lg.flwaves": "चलती रेखाएँ: लहरों के चलने की दिशा, रंग लहर की ऊँचाई से",
    "lg.flcur": "चलती रेखाएँ: समुद्र की सतह की धाराएँ (दिखाने के लिए तेज़ की गई), रंग गति से", "rd.hs": "लहरें {v} मी, {dir} की ओर", "rd.cur": "धारा {v} m/s, {dir} की ओर",
    "oc.h": "समुद्री धाराएँ और गायर", "oc.p": "हवाएँ समुद्र की सतह पर पाँच विशाल चक्र चलाती हैं, जिन्हें गायर कहते हैं: उत्तरी गोलार्ध में दक्षिणावर्त और दक्षिणी में वामावर्त। उनके पश्चिमी किनारों पर तेज़, गर्म धाराएँ उष्णकटिबंधीय गर्मी को ध्रुवों की ओर ले जाती हैं (लाल: गल्फ़ स्ट्रीम, कुरोशियो, अगुलहास); पूर्वी किनारों पर ठंडी धाराएँ भूमध्य रेखा की ओर बहती हैं (नीला: कैनरी, कैलिफ़ोर्निया, बेंगुएला, हम्बोल्ट)। हिंद महासागर में मानसून सोमाली धारा को साल में दो बार उलट देता है। गर्म धाराएँ चक्रवातों को ऊर्जा दे सकती हैं।",
    "ly.towns": "तटीय शहर: 5 दिन का पूर्वानुमान", "ly.labels": "जगहों के नाम", "sd.fc": "पूर्वानुमानित स्थिति (GEFS समूह औसत)", "sd.towns": "तटीय शहर जिनके यह सबसे पास आ सकता है", "sd.closest": "लगभग {d} तक पास, लगभग {n} दिन में",
    "sd.ri": "अगले 24 घंटों में तेज़ी से शक्तिशाली होने की संभावना:", "sd.typical": "सामान्य तूफ़ान: {p}%", "sd.hidefc": "पूर्वानुमान ट्रैक छिपाएँ", "sd.showfc": "पूर्वानुमान ट्रैक दिखाएँ",
    "sd.centre": "इस पर केंद्रित करें", "tc.none": "इस शहर का पूर्वानुमान अभी उपलब्ध नहीं है।", "tc.mine": "इसे मेरा शहर बनाएँ",
        "v.3d": "3D ग्लोब", "v.2d": "सपाट मानचित्र", "v.stack": "सभी ऊँचाइयाँ एक साथ (3D भंवर)", "v.2donly": "परिसंचरण परतें सपाट मानचित्र पर दिखाई जाती हैं।",
    "dir16.north": "उत्तर", "dir16.north-northeast": "उत्तर-उत्तरपूर्व", "dir16.northeast": "उत्तर-पूर्व", "dir16.east-northeast": "पूर्व-उत्तरपूर्व", "dir16.east": "पूर्व",
    "dir16.east-southeast": "पूर्व-दक्षिणपूर्व", "dir16.southeast": "दक्षिण-पूर्व", "dir16.south-southeast": "दक्षिण-दक्षिणपूर्व", "dir16.south": "दक्षिण", "dir16.south-southwest": "दक्षिण-दक्षिणपश्चिम",
    "dir16.southwest": "दक्षिण-पश्चिम", "dir16.west-southwest": "पश्चिम-दक्षिणपश्चिम", "dir16.west": "पश्चिम", "dir16.west-northwest": "पश्चिम-उत्तरपश्चिम", "dir16.northwest": "उत्तर-पश्चिम", "dir16.north-northwest": "उत्तर-उत्तरपश्चिम",
  };
  const DICT = { en: EN, hi: HI };
  const ORIG = new Map();
  let lang = "en";
  try { lang = localStorage.getItem("tc-lang") || ((navigator.language || "").startsWith("hi") ? "hi" : "en"); } catch (e) { /* ignore */ }
  if (!DICT[lang]) lang = "en";
  function t(key, vars = {}, fallback) {
    let s = (DICT[lang] && DICT[lang][key]) ?? EN[key] ?? fallback ?? key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
    return s;
  }
  function apply() {
    document.documentElement.lang = lang;
    if (FONTS[lang] && !document.getElementById(`font-${lang}`)) {
      const l = Object.assign(document.createElement("link"), { id: `font-${lang}`, rel: "stylesheet", href: `https://fonts.googleapis.com/css2?family=${FONTS[lang]}&display=swap` });
      document.head.append(l);
    }
    for (const el of document.querySelectorAll("[data-i18n]")) { if (!ORIG.has(el)) ORIG.set(el, el.textContent); const k = el.dataset.i18n; el.textContent = lang === "en" ? ORIG.get(el) : t(k, {}, ORIG.get(el)); }
    for (const el of document.querySelectorAll("[data-i18n-html]")) { if (!ORIG.has(el)) ORIG.set(el, el.innerHTML); const k = el.dataset.i18nHtml; el.innerHTML = lang === "en" || !(DICT[lang] || {})[k] ? ORIG.get(el) : DICT[lang][k]; }
    for (const el of document.querySelectorAll("[data-i18n-ph]")) { const a = `ph:${el.dataset.i18nPh}`; if (!ORIG.has(a)) ORIG.set(a, el.placeholder); el.placeholder = lang === "en" ? ORIG.get(a) : t(el.dataset.i18nPh, {}, ORIG.get(a)); }
  }
  function set(l) { if (!DICT[l]) return; lang = l; try { localStorage.setItem("tc-lang", l); } catch (e) { /* ignore */ } apply(); document.dispatchEvent(new CustomEvent("langchange", { detail: l })); }
  window.I18N = { t, apply, set, get lang() { return lang; }, LANGS };
})();
