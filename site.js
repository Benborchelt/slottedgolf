/* Slotted Golf — waitlist form wiring.
 *
 * The form's `data-form-endpoint` holds the waitlist API URL. On submit we
 * POST JSON `{email}` there and show inline status — no mail client, no
 * fallback. Success and error states render in #waitlist-status.
 */
(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var status = document.getElementById("waitlist-status");
  var input = document.getElementById("wl-email");
  var button = form.querySelector("button[type=submit]");
  var endpoint = form.getAttribute("data-form-endpoint") || "";

  function setStatus(msg, isError) {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle("error", Boolean(isError));
  }

  function looksLikeEmail(value) {
    // Cheap sanity check — the server does the real validation.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = (input && input.value ? input.value : "").trim();
    if (!looksLikeEmail(email)) {
      setStatus("Please enter a valid email address.", true);
      if (input) input.focus();
      return;
    }

    if (!endpoint) {
      setStatus("Signup isn’t available right now — please try again later.", true);
      return;
    }

    if (button) button.disabled = true;
    setStatus("Joining…");

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email: email })
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          setStatus("You’re on the list. See you on the tee.");
        } else {
          setStatus("Something went wrong — please try again in a minute.", true);
        }
      })
      .catch(function () {
        setStatus("Couldn’t reach the server — check your connection and try again.", true);
      })
      .finally(function () {
        if (button) button.disabled = false;
      });
  });
})();
