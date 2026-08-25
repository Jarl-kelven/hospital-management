// data/doctors.ts

export type DoctorPreview = {
  id: string;
  name: string;
  specialization: string;
  avgRating: number;
  totalRating: number;
  photo: string; // public path: "/images/doc1.png"
  totalPatients: number;
  hospital: string;
};

export const doctors: DoctorPreview[] = [
  {
    id: "01",
    name: "Dr. John Simmmons",
    specialization: "Surgeon",
    avgRating: 4.8,
    totalRating: 272,
    photo: "/images/doc1.png",
    totalPatients: 1100,
    hospital: "Silicon Hospital, Opic.",
  },
  {
    id: "02",
    name: "Dr. Michael Mel-Smith",
    specialization: "Neurologist",
    avgRating: 5.0,
    totalRating: 272,
    photo: "/images/doc2.png",
    totalPatients: 1800,
    hospital: "Silicon Hospital, Opic.",
  },
  {
    id: "03",
    name: "Dr. Joseph Samuels",
    specialization: "Dermatologist",
    avgRating: 4.7,
    totalRating: 272,
    photo: "/images/doc3.png",
    totalPatients: 1200,
    hospital: "Silicon Hospital, Opic.",
  },
];