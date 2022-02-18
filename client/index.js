document.getElementById("complimentButton").addEventListener("click", (event) => {
    axios
        .get("/api/compliment/")
        .then((res) => {
            const data = res.data;
            alert(data);
        });
});

document.getElementById("fortune-button").addEventListener("click", (event) => {
    axios
        .get("/api/fortune")
        .then((res) => {
            const data = res.data;
            alert(data);
        })
});