var app = new Vue({
  el: "#app",
  data: {
    requests: [],
  },
  methods: {
    upvoteRequest(id) {
      const upvote = firebase.functions().httpsCallable("upvote");
      upvote({
        id,
      })
        .then(() => showNotification("Voted Up!", "success"))
        .catch((err) => showNotification(err.message, "failure"));
    },
  },
  mounted() {
    const ref = firebase
      .firestore()
      .collection("requests")
      .orderBy("upvotes", "desc");

    ref.onSnapshot((snapshot) => {
      this.requests = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
    });
  },
});
