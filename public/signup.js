const API_URL = "http://localhost:3000";
let token;

const message = document.getElementById("message");

document
  .getElementById("signup-button")
  .addEventListener("click", async function (e) {
    e.preventDefault(); // Förhindrar att sidan laddas om.
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let signupResponse = await fetch(API_URL + "/signup", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    //Om status är 200 (Ok), har inloggningen gått bra.
    if (signupResponse.status === 200) {
      let signupResponseData = await signupResponse.json();
      console.log("token från API", signupResponseData);

      localStorage.setItem("token", signupResponseData); // spara token från APIet i variabel

      document.getElementById("signup-form").style.display = "none";
      message.innerHTML = "Successfully signed up";
    } else {
      // Om något gått fel och status inte är 200
      let errorResponse = await signupResponse.json();
      message.innerHTML = `Error: ${
        errorResponse.error || "Something went wrong"
      }`;
    }
  });
