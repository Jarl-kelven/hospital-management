// data/faqs.ts

export type Faq = {
  id: string;
  question: string;
  content: string;
};

export const faqs: Faq[] = [
  {
    id: "faq-1",
    question: "What is your medical care?",
    content:
      "We offer comprehensive care across specialties including cardiology, neurology, dermatology, mental health, and general surgery, all under one roof.",
  },
  {
    id: "faq-2",
    question: "What happens if I need to go a hospital?",
    content:
      "Our emergency department is open 24/7, and our triage team will get you seen based on the urgency of your condition.",
  },
  {
    id: "faq-3",
    question: "How do I book a follow up appointment?",
    content:
      "You can schedule directly through your patient dashboard or call our scheduling line, and we'll match you with your preferred doctor.",
  },
  {
    id: "faq-4",
    question: "Can I visit your medical office?",
    content:
      "Yes, walk-ins are welcome for general consultations, though booking ahead helps reduce your wait time.",
  },
  {
    id: "faq-5",
    question: "Does you provide urgent care?",
    content:
      "Yes, our urgent care unit handles non-life-threatening conditions like minor injuries, infections, and same-day illness visits without needing an ER visit.",
  },
];