const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendOnNewPost = functions.firestore
.document("products/{productId}")
.onCreate(async (snap, context)=>{
    const data = snap.data();
    const authorUid = data.userId || data.uid || data.sellerId || "";

    const titleText = `${data.title || "Thil thar"} - Post thar a awm e!`;
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

    const bodyText = `${userName}${locationPart? `, ${locationPart}` : ""} chuan Post thar a siam e.`;

    // 1. FCM TOKENS LA
    const tokensSnap = await admin.firestore().collection("fcmTokens").get();
    const allTokensData = tokensSnap.docs.map(d => d.data());
    const tokens = allTokensData.map(d=> d.token).filter(Boolean);

    // 2. FIRESTORE NOTIFICATIONS - Mi zawng zawng tan siam (a zuartu tiam lo in)
    const usersSnap = await admin.firestore().collection("users").get();

    const batch = admin.firestore().batch();
    usersSnap.forEach(userDoc => {
      if(userDoc.id === authorUid) return; // A zuartu hnenah thawn lo

      const notifRef = admin.firestore().collection("notifications").doc();
      batch.set(notifRef, {
        userId: userDoc.id, // Tu hnenah nge a thlen dawn
        title: titleText,
        body: bodyText,
        productId: context.params.productId,
        type: "product",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        fromUserId: authorUid,
        image: data.images? data.images[0] : ""
      });
    });
    await batch.commit();

    // 3. FCM THAWN LEH
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
