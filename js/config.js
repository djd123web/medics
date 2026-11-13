/* ---------------------------------------------------------------
   Site configuration — edit this file after connecting your form service.
   Until the endpoints below are replaced, the forms will NOT send anything
   and will tell visitors that they are not yet connected.
   --------------------------------------------------------------- */
window.MEDICS_CONFIG = {
  // SIMULATION SWITCH. While true, the forms are checked exactly as in production and then show
  // the normal confirmation message, but NOTHING IS SENT (no email, no CV). Messages and
  // applications typed by real visitors will be lost. Set to false and add the two endpoints
  // below before the site receives real visitors.
  simulateSubmission: true,

  // Contact form endpoint, e.g. "https://formspree.io/f/abcdwxyz"
  contactEndpoint: "https://formspree.io/f/YOUR_CONTACT_FORM_ID",
  // Careers / CV form endpoint (must support file uploads), e.g. "https://formspree.io/f/efghijkl"
  careersEndpoint: "https://formspree.io/f/YOUR_CAREERS_FORM_ID",
  // Maximum CV size in megabytes. Match this to your form service's upload limit.
  maxCvMB: 5,
  // Allowed CV file extensions
  allowedCvExtensions: ["pdf", "doc", "docx"]
};
