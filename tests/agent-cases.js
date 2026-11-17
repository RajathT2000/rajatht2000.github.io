// Question → expected answer cases for the "Ask me" agent (shared by unit + browser tests).
const cases = [
  ["What's your current project?", /learning about AI agents and building small projects/],
  ['What are you learning?', /learning about AI agents/],
  ['Did you finish your masters?', /completed his Masters of IT in AI.*October 2026/],
  ['Where did you study?', /Macquarie University/],
  ['Tell me about your bachelor degree', /LBS College of Engineering, Kasaragod/],
  ['Where are you from?', /from India/],
  ['Do you know Python?', /Python, AI\/ML, Django and Selenium/],
  ['Tech stack', /Selenium/],
  ['Where have you worked?', /QBurst/],
  ['Any certifications?', /Python Programming.*Django Framework.*AI & Machine Learning/],
  ['What are your hobbies?', /athletics and playing the piano/],
  ['How can I contact you?', /Contact section/],
  ['What is your email?', /rajatht@icloud\.com/],
  ['Tell me about Split', /Split is a live web app for sharing bills fairly/],
  ['What projects have you built?', /Split/],
  ['Is Split built with Django?', /Django and PostgreSQL/],
  ['Tell me about yourself', /Rajath Thaliyadath/],
  ['Who are you?', /Rajath Thaliyadath/],
  ['Tell me about the price tracker', /OzBargain/],
  ['How do you get deal alerts?', /ntfy/],
  ['What is your LinkedIn?', /linkedin\.com\/in\/rajath-thaliyadath-77b040181/],
  ['Do you have a GitHub?', /github\.com\/RajathT2000/],
  ['Can I download your CV?', /Rajath_Thaliyadath_CV\.pdf/],
  ['resume please', /Rajath_Thaliyadath_CV\.pdf/],
];
const unrelated = ['What is the capital of France?', 'Who is the president?', 'Write me a poem', 'whats the weather tomorrow'];
const notOngoing = ['Are you studying?', 'education', 'Where are you from?'];
const REFUSAL = /only answer questions about Rajath's portfolio/;

module.exports = { cases, unrelated, notOngoing, REFUSAL };
