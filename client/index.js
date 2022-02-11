document.getElementById("complimentButton").addEventListener("click", (event) => {
    axios
        .get("http://localhost:4000/api/compliment/")
        .then((res) => {
            const data = res.data;
            alert(data);
        });
});

document.getElementById("fortune-button").addEventListener("click", (event) => {
    axios
        .get("http://localhost:4000/api/fortune")
        .then((res) => {
            const data = res.data;
            alert(data);
        })
});

document.getElementById("chat-link").addEventListener("click", (event) => {
    window.location.replace("http://localhost:4000/chat");
});