const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// auth trigger (sign up)
exports.newuserSignup = functions.auth.user().onCreate((user) => {
  return admin.firestore().collection("users").doc(user.uid).set({
    email: user.email,
    upvotedOn: [],
  });
});

// auth trigger (delete)
exports.userDeleted = functions.auth.user().onDelete((user) => {
  const doc = admin.firestore().collection("users").doc(user.uid);
  return doc.delete();
});

// new request trigger http
exports.addRequest = functions.https.onCall((data, ctx) => {
  if (!ctx.auth)
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only loggedin users can add requests",
    );

  if (data.text.length > 30)
    throw new functions.https.HttpsError(
      "out-of-range",
      "Text longer than 30 chars.",
    );

  return admin.firestore().collection("requests").add({
    text: data.text,
    upvotes: 0,
  });
});

// // upvote callable function
exports.upvote = functions.https.onCall(async (data, context) => {
  // check auth state
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "only authenticated users can vote up requests",
    );
  }
  // get refs for user doc & request doc
  const user = admin.firestore().collection("users").doc(context.auth.uid);
  const request = admin.firestore().collection("requests").doc(data.id);

  const doc = await user.get();
  // check thew user hasn't already upvoted
  if (doc.data().upvotedOn.includes(data.id)) {
    throw new functions.https.HttpsError(
      "already-exists",
      "You can only vote something up once",
    );
  }

  // update the array in user document
  await user.update({
    upvotedOn: [...doc.data().upvotedOn, data.id],
  });

  // update the votes on the request
  return request.update({
    upvotes: admin.firestore.FieldValue.increment(1),
  });
});

// firestore trigger for tracking activity
exports.logActivities = functions.firestore
  .document("/{collection}/{id}")
  .onCreate(async (snap, context) => {
    console.log(snap.data());

    const activities = admin.firestore().collection("activities");
    const collection = context.params.collection;

    if (collection === "requests") {
      return activities.add({
        text: `a new tutorial request was added`,
      });
    }
    if (collection === "users") {
      return activities.add({
        text: `a new user signed up`,
      });
    }

    return null;
  });
