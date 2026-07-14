/* Slotted Golf — waitlist form wiring.
 *
 * Behavior:
 *  - If the form has a `data-form-endpoint` (or `action`) URL set, the email is
 *    POSTed there as form data (Formspree-style: expects JSON `{ok: true}` or 2xx).
 *  - If no endpoint is configured, the form degrades to a `mailto:` draft
 *    addressed to `data-fallback-email`, so the page works with zero backend.
 *
 * See README.md ("Waitlist form") for how to configure the endpoint.
 */
(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var status = document.getElementById("waitlist-status");
  var input = document.getElementById("wl-email");
  var endpoint = form.getAttribute("data-form-endpoint") || form.getAttribute("action") || "";
  var fallbackEmail = form.getAttribute("data-fallback-email") || "hello@slottedgolf.org";

  function setStatus(msg, isError) {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle("error", Boolean(isError));
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = (input && input.value ? input.value : "").trim();
    if (!email) {
      setStatus("Please enter your email address.", true);
      return;
    }

    if (!endpoint) {
      // No endpoint configured — open a pre-filled email draft instead.
      var subject = encodeURIComponent("Slotted Golf waitlist");
      var body = encodeURIComponent("Please add me to the Slotted Golf waitlist: " + email);
      window.location.href = "mailto:" + fallbackEmail + "?subject=" + subject + "&body=" + body;
      setStatus("Opening your email app… send that draft and you’re on the list.");
      return;
    }

    var button = form.querySelector("button[type=submit]");
    if (button) button.disabled = true;
    setStatus("Joining…");

    var data = new FormData(form);

    fetch(endpoint, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          setStatus("You’re on the list. See you on the tee.");
        } else {
          return response.json().then(
            function (payload) {
              var msg =
                payload && payload.errors && payload.errors.length
                  ? payload.errors.map(function (e) { return e.message; }).join(", ")
                  : "Something went wrong — please try again.";
              setStatus(msg, true);
            },
            function () {
              setStatus("Something went wrong — please try again.", true);
            }
          );
        }
      })
      .catch(function () {
        setStatus("Network error — please try again.", true);
      })
      .finally(function () {
        if (button) button.disabled = false;
      });
  });
})();
