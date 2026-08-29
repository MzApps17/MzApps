const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendOnNewPost = functions.firestore
 .document("products/{productId}")
 .onCreate(async (snap, context)=>{
    const data = snap.data();
    
    // TITLE: Grass Cutter - Post thar a awm e!
    const titleText = `${data.title || "Thil thar"} - Post thar a awm e!`;
    
    // BODY: Lalpekkima, Zamuang, Mamit Dist chuan Post thar a siam e.
    const userName = data.userName || data.sellerName || "Mi pakhat";
    const village = data.village || "";
    const district = data.district || "";
    
    let locationPart = "";
    if(village && district){
      locationPart = `${village}, ${district} Dist`;
    } else if(village){
      locationPart = village;
    } else if(district){
      locationPart = `${district} Dist`;
    } else if(data.location){
      locationPart = data.location;
    }

    const bodyText = `${userName}${locationPart ? `, ${locationPart}` : ""} chuan Post thar a siam e.`;

    const tokensSnap = await admin.firestore().collection("fcmTokens").get();
    const tokens = tokensSnap.docs.map(d=> d.data().token).filter(Boolean);
    if(tokens.length === 0) return null;

    const chunks = [];
    for(let i=0; i<tokens.length; i+=500){
      chunks.push(tokens.slice(i, i+500));
    }

    for(const chunk of chunks){
      await admin.messaging().sendEachForMulticast({
        notification: {
          title: titleText,
          body: bodyText,
        },
        data: {
          productId: context.params.productId,
          type: "product",
          click_action: "FLUTTER_NOTIFICATION_CLICK"
        },
        tokens: chunk,
      });
    }
    return null;
  });
