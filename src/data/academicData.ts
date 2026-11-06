export type LabCode = 'RDIB' | 'MSI' | 'SE' | 'IKTI' | 'ADDI';

export interface LecturerProfile {
  shortName: string;
  fullName: string;
  lab: LabCode;
  role: string;
  expertise: string[];
  education: string[];
  researchFocus: string;
  description: string;
  email?: string;
  profileUrl?: string;
}

export const LECTURER_PROFILES: Record<string, LecturerProfile> = {
  'Ahmad Muklason': {
    shortName: 'Ahmad Muklason',
    fullName: 'Prof. Ir. Ahmad Muklason, S.Kom., M.Sc., Ph.D.',
    lab: 'RDIB',
    role: 'Guru Besar / Peneliti Rekayasa Data & Inteligensi Bisnis',
    expertise: ['Artificial Intelligence', 'Metaheuristics & Optimization', 'Intelligent Scheduling', 'Data Mining'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2001)',
      'S2: Information Technology, Universiti Teknologi Petronas (UTP), Malaysia (2007)',
      'S3: Computer Science, The University of Nottingham, United Kingdom (2012)',
    ],
    researchFocus: 'Kecerdasan buatan, algoritma metaheuristik, optimasi kombinatorial, dan penjadwalan cerdas.',
    description: 'Pakar algoritma optimasi dan metaheuristik. Riset bimbingannya berfokus pada pemecahan persoalan optimasi kompleks dunia nyata, algoritma genetika, serta pemodelan analitik data berskala besar.',
    email: 'muklason@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Amalia Utamima': {
    shortName: 'Amalia Utamima',
    fullName: 'Dr. Amalia Utamima, S.Kom., M.B.A.',
    lab: 'RDIB',
    role: 'Dosen / Peneliti Rekayasa Data & Inteligensi Bisnis',
    expertise: ['Business Intelligence', 'Customer Analytics', 'Marketing Analytics', 'Data-Driven Decision Making'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2005)',
      'S2: Master of Business Administration (MBA), NTUST Taiwan (2010)',
      'S3: Doctor of Philosophy (Ph.D.), NTUST Taiwan (2013)',
    ],
    researchFocus: 'Integrasi data analitik dengan strategi bisnis modern, customer lifetime value, dan analitik pemasaran digital.',
    description: 'Menggabungkan keilmuan teknologi informasi dengan strategi bisnis modern. Riset bimbingan fokus pada Business Intelligence (BI), perilaku konsumen digital, segmentasi pasar, dan pemanfaatan data analitik.',
    email: 'amalia.utamima@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Anisah Herdiyanti': {
    shortName: 'Anisah Herdiyanti',
    fullName: 'Dr. Anisah Herdiyanti, S.Kom., M.Sc.',
    lab: 'MSI',
    role: 'Dosen / Peneliti Manajemen Sistem Informasi',
    expertise: ['IT Governance & COBIT', 'IT Service Management (ITSM)', 'Enterprise Architecture', 'Information Systems Audit'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2005)',
      'S2: Information Systems, Universiti Teknologi Malaysia (UTM) (2010)',
      'S3: Sistem Informasi / Teknik Elektro, Institut Teknologi Sepuluh Nopember (ITS) (2017)',
    ],
    researchFocus: 'Tata kelola TI, manajemen layanan TI, keselarasan strategi TI-bisnis, dan audit sistem informasi.',
    description: 'Pakar di bidang tata kelola TI dan manajemen layanan TI. Sangat cocok untuk bimbingan tesis yang mengkaji keselarasan strategis TI dengan bisnis, evaluasi kerangka kerja COBIT/ITIL, audit sistem informasi, dan arsitektur enterprise.',
    email: 'anisah@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Apol Pribadi Subriadi': {
    shortName: 'Apol Pribadi Subriadi',
    fullName: 'Prof. Dr. Apol Pribadi Subriadi, S.T., M.T.',
    lab: 'MSI',
    role: 'Guru Besar / Peneliti Senior Manajemen Sistem Informasi',
    expertise: ['IT Risk Management', 'IT Valuation & Business Value', 'Information Security Culture', 'Strategic Information Systems'],
    education: [
      'S1: Teknik Elektro, Institut Teknologi Sepuluh Nopember (ITS) (1989)',
      'S2: Teknik Industri, Institut Teknologi Sepuluh Nopember (ITS) (1998)',
      'S3: Ilmu Manajemen, Universitas Brawijaya (UB) (2009)',
    ],
    researchFocus: 'Valuasi nilai investasi TI (IT Value), manajemen risiko teknologi informasi, dan perilaku keamanan siber.',
    description: 'Guru Besar di Departemen Sistem Informasi ITS yang mendalami valuasi investasi TI (IT Value), manajemen risiko teknologi informasi, serta aspek perilaku manusia terhadap keamanan informasi.',
    email: 'apol@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Arif Wibisono': {
    shortName: 'Arif Wibisono',
    fullName: 'Dr. Arif Wibisono, S.Kom., M.Sc.',
    lab: 'SE',
    role: 'Dosen / Peneliti Sistem Enterprise',
    expertise: ['Business Process Management (BPM)', 'Process Mining', 'Enterprise Systems', 'ERP Architecture'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2002)',
      'S2: Information Systems, The University of Manchester, UK (2008)',
      'S3: Information Systems, Institut Teknologi Sepuluh Nopember (ITS) (2014)',
    ],
    researchFocus: 'Process Mining, analisis dan perbaikan proses bisnis, simulasi alur kerja enterprise, dan ERP.',
    description: 'Fokus pada rekayasa dan perbaikan proses bisnis, simulasi alur kerja enterprise, dan Process Mining (ekstraksi knowledge dari event log sistem).',
    email: 'arif@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Aris Tjahyanto': {
    shortName: 'Aris Tjahyanto',
    fullName: 'Dr. Ir. Aris Tjahyanto, M.Kom.',
    lab: 'ADDI',
    role: 'Dosen / Peneliti Senior Akuisisi Data & Diseminasi Informasi',
    expertise: ['Machine Learning untuk SI', 'Biometric Authentication', 'Natural Language Processing (NLP)', 'Chatbot & SOA Architecture'],
    education: [
      'S1: Teknik Elektro, Institut Teknologi Sepuluh Nopember (ITS) (1984)',
      'S2: Ilmu Komputer, Universitas Indonesia (UI) (1992)',
      'S3: Teknik Elektro, Institut Teknologi Sepuluh Nopember (ITS) (2010)',
    ],
    researchFocus: 'Penerapan Machine Learning pada sistem informasi, biometrik, NLP, chatbot kecerdasan buatan, dan pengampu kelas Pengembangan dan Penerapan Sistem.',
    description: 'Pakar senior dalam pemodelan Machine Learning dan ekstraksi data cerdas. Pengampu mata kuliah Pengembangan dan Penerapan Sistem (ES255102) di S2 SI ITS.',
    email: 'aris@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Bambang Setiawan': {
    shortName: 'Bambang Setiawan',
    fullName: 'Bambang Setiawan, S.Kom., M.Cs., Ph.D.',
    lab: 'IKTI',
    role: 'Dosen / Peneliti Infrastruktur & Keamanan TI',
    expertise: ['Computer Networks', 'Network & Cloud Security', 'Distributed Systems', 'IoT Infrastructure'],
    education: [
      'S1: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (1989)',
      'S2: Ilmu Komputer, Universitas Gadjah Mada (UGM) (1997)',
      'S3: Computer Science & Systems Engineering, Kumamoto University, Jepang (2011)',
    ],
    researchFocus: 'Arsitektur jaringan komputer modern, sistem terdistribusi, dan ketahanan keamanan infrastruktur TI.',
    description: 'Pakar jaringan komputer, arsitektur sistem terdistribusi, dan keamanan komputasi awan. Penelitian bimbingannya mendalami ketahanan infrastruktur jaringan modern dan mitigasi ancaman siber.',
    email: 'bambang.setiawan@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Erma Suryani': {
    shortName: 'Erma Suryani',
    fullName: 'Prof. Dr. Ir. Erma Suryani, S.T., M.T., Ph.D.',
    lab: 'SE',
    role: 'Guru Besar / Peneliti Senior Sistem Enterprise',
    expertise: ['System Dynamics', 'Scenario Planning & Policy Modeling', 'Supply Chain Management', 'Enterprise Simulation'],
    education: [
      'S1: Teknik Elektro, Institut Teknologi Sepuluh Nopember (ITS) (1989)',
      'S2: Teknik Industri, Institut Teknologi Sepuluh Nopember (ITS) (1998)',
      'S3: Industrial Management, National Taiwan University of Science and Technology (NTUST) (2006)',
    ],
    researchFocus: 'Model-Driven Decision Support Systems, System Dynamics, simulasi sistem enterprise, logistik, dan smart energy/transportation.',
    description: 'Guru Besar terkemuka di bidang System Dynamics di Indonesia. Menghasilkan puluhan publikasi internasional bereputasi tinggi mengenai simulasi sistem industri, perencanaan kebijakan, logistik, dan rantai pasok.',
    email: 'erma@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Faizal Mahananto': {
    shortName: 'Faizal Mahananto',
    fullName: 'Dr. Faizal Mahananto, S.Kom., M.Eng., Ph.D.',
    lab: 'RDIB',
    role: 'Dosen / Kepala Laboratorium RDIB & Pengelola Pascasarjana',
    expertise: ['Medical Informatics', 'Deep Learning & Computer Vision', 'Biomedical Signal & Image Processing', 'Computational Physiology'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2000)',
      'S2: Information Science & Electrical Engineering, Kumamoto University, Jepang (2008)',
      'S3: Computer Science & Systems Engineering, Kumamoto University, Jepang (2010)',
    ],
    researchFocus: 'Healthcare Information Systems, AI in Healthcare, pemrosesan sinyal biomedis (ECG/HRV), dan bio-sensing telemonitoring.',
    description: 'Pakar informatika biomedis, pemrosesan citra medis digital, dan deep learning. Banyak mengarahkan mahasiswa pada riset pemanfaatan AI untuk diagnosis kesehatan, ekstraksi fitur citra/sinyal medis, dan sistem cerdas terapan.',
    email: 'faizal@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Febriliyan Samopa': {
    shortName: 'Febriliyan Samopa',
    fullName: 'Dr.Eng. Febriliyan Samopa, S.Kom., M.Kom.',
    lab: 'IKTI',
    role: 'Dosen / Peneliti Senior Infrastruktur & Keamanan TI',
    expertise: ['IoT & Embedded System', 'Image & Pattern Processing', 'Intelligent Networks & Security', 'VR/AR Interactive Multimedia'],
    education: [
      'S1: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (1992)',
      'S2: Ilmu Komputer, Universitas Indonesia (UI) (1998)',
      'S3: Doctor of Engineering (Dr.Eng.), Hiroshima University, Jepang (2005)',
    ],
    researchFocus: 'Infrastruktur TI cerdas, jaringan IoT, keamanan sistem informasi, dan pengampu kelas Infrastruktur Teknologi Informasi.',
    description: 'Pengampu mata kuliah Infrastruktur Teknologi Informasi (ES255101) di S2 SI ITS. Memiliki reputasi internasional dalam sistem jaringan cerdas, pemrosesan pola citra, dan teknologi multimedia interaktif.',
    email: 'febriliyan@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Feby Artwodini': {
    shortName: 'Feby Artwodini',
    fullName: 'Dr. Feby Artwodini Muqtadiroh, S.Kom., M.T.',
    lab: 'MSI',
    role: 'Dosen / Peneliti Manajemen Sistem Informasi',
    expertise: ['Electronic Government (SPBE)', 'Smart City Frameworks', 'IT Governance in Public Sector', 'Service Quality Evaluation'],
    education: [
      'S1: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (1998)',
      'S2: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (2003)',
      'S3: Sistem Informasi / Teknik Elektro, Institut Teknologi Sepuluh Nopember (ITS) (2013)',
    ],
    researchFocus: 'Transformasi digital pemerintahan (SPBE), arsitektur smart city, evaluasi kualitas layanan TI publik, dan tata kelola sistem informasi.',
    description: 'Pakar sistem informasi pemerintahan digital (SPBE) dan kerangka kota cerdas (Smart City) di Indonesia. Riset bimbingan banyak berkontribusi pada pengukuran kematangan layanan publik digital dan tata kelola TI sektor publik.',
    email: 'feby@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Hanim Maria Astuti': {
    shortName: 'Hanim Maria Astuti',
    fullName: 'Hanim Maria Astuti, S.Kom., M.Sc., Ph.D.',
    lab: 'MSI',
    role: 'Dosen / Peneliti Manajemen Sistem Informasi',
    expertise: ['Information Systems Quality', 'IT Audit', 'Knowledge Management Systems', 'Software Process Quality'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2003)',
      'S2: Information Systems, Universiti Teknologi Malaysia (UTM) (2008)',
    ],
    researchFocus: 'Kualitas sistem informasi, audit sistem informasi, sistem manajemen pengetahuan (KM), dan tata kelola data perusahaan.',
    description: 'Mendalami manajemen kualitas sistem informasi, audit sistem informasi, serta pengelolaan pengetahuan (Knowledge Management) dalam organisasi. Bimbingan tesis terstruktur dengan metodologi yang solid.',
    email: 'hanim@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Izzat Aulia Akbar': {
    shortName: 'Izzat Aulia Akbar',
    fullName: 'Izzat Aulia Akbar, S.Kom., M.Eng., Ph.D.',
    lab: 'IKTI',
    role: 'Dosen / Peneliti Infrastruktur & Keamanan TI',
    expertise: ['Cloud Computing Architecture', 'IoT Security & Privacy', 'Edge Computing', 'Microservices & Container Security'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2009)',
      'S2: Kumamoto University, Jepang (2014)',
      'S3: Kumamoto University, Jepang (2016)',
    ],
    researchFocus: 'Arsitektur cloud computing, edge intelligence, privasi IoT, dan keamanan kontainer.',
    description: 'Lulusan doktoral dengan fokus kuat pada komputasi awan generasi baru, keamanan perangkat Internet of Things (IoT), komputasi edge, dan kontainerisasi.',
    email: 'izzat@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Mahendrawathi ER': {
    shortName: 'Mahendrawathi ER',
    fullName: 'Prof. Dr. Ir. Mahendrawathi E. R., S.T., M.Sc.',
    lab: 'SE',
    role: 'Guru Besar / Peneliti Senior Sistem Enterprise',
    expertise: ['Business Process Management (BPM)', 'Process Mining & Conformance Checking', 'ERP Implementation', 'Supply Chain Integration'],
    education: [
      'S1: Teknik Industri, Institut Teknologi Sepuluh Nopember (ITS) (1994)',
      'S2: Operations Management & Manufacturing Systems, University of Nottingham, UK (1999)',
      'S3: Manufacturing Engineering & Operations Management, University of Nottingham, UK (2001)',
    ],
    researchFocus: 'Process Mining internasional, manajemen proses bisnis digital, ERP rantai pasok, dan transformasi sistem operasional enterprise.',
    description: 'Guru Besar berkaliber internasional yang aktif memimpin riset Process Mining dan Business Process Management di Indonesia. Membimbing mahasiswa S2 menghasilkan karya ilmiah berstandar Scopus dengan topik penemuan, keselarasan, dan peningkatan proses bisnis digital.',
    email: 'mahendra_w@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Nur Aini Rakhmawati': {
    shortName: 'Nur Aini Rakhmawati',
    fullName: 'Prof. Nur Aini Rakhmawati, S.Kom., M.Sc.Eng., Ph.D.',
    lab: 'ADDI',
    role: 'Guru Besar / Kepala Laboratorium ADDI',
    expertise: ['Linked Open Data', 'Semantic Web & Ontologies', 'Halal Supply Chain & Information Systems', 'Knowledge Graph'],
    education: [
      'S1: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (2000)',
      'S2: Electronic Engineering, National Taiwan University of Science and Technology (NTUST) (2006)',
      'S3: Information Engineering, National University of Ireland (NUI) Galway (2011)',
    ],
    researchFocus: 'Linked Open Data, ontologi web semantik, knowledge graph, dan pengampu kelas Manajemen Data, Informasi dan Konten.',
    description: 'Guru Besar dan pionir terdepan Linked Open Data dan Web Semantik di Indonesia. Mengampu mata kuliah Manajemen Data, Informasi dan Konten (ES255104) di S2 SI ITS serta membimbing riset ekosistem data terbuka dan graph pengetahuan.',
    email: 'nur.aini@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Renny Nadlifatin': {
    shortName: 'Renny Nadlifatin',
    fullName: 'Renny Nadlifatin, S.Kom., M.B.A., Ph.D.',
    lab: 'MSI',
    role: 'Dosen / Peneliti Manajemen Sistem Informasi (Kepala Prodi MMT ITS)',
    expertise: ['Technology Adoption & User Behavior (TAM/UTAUT)', 'Social Media Analytics', 'Green IT & Sustainability', 'Structural Equation Modeling (SEM)'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2005)',
      'S2: Master of Business Administration (MBA), NTUST Taiwan (2010)',
      'S3: Doctor of Philosophy (Ph.D.) Industrial Management, NTUST Taiwan (2013)',
    ],
    researchFocus: 'Perilaku adopsi teknologi pengguna, Green IT, analitik media sosial, dan metodologi Structural Equation Modeling (SEM).',
    description: 'Pakar riset perilaku pengguna sistem informasi, adopsi teknologi cerdas, dan analitik media sosial. Sangat mahir dalam metodologi SEM (PLS-SEM/CB-SEM) serta membimbing mahasiswa mempublikasikan artikel di jurnal bereputasi tinggi.',
    email: 'renny@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Retno Aulia Vinarti': {
    shortName: 'Retno Aulia Vinarti',
    fullName: 'Retno Aulia Vinarti, S.Kom., M.Kom., Ph.D.',
    lab: 'RDIB',
    role: 'Dosen / Peneliti Rekayasa Data & Inteligensi Bisnis',
    expertise: ['Bayesian Networks & Probabilistic Reasoning', 'Clinical Decision Support Systems (CDSS)', 'Healthcare Informatics', 'Uncertainty Reasoning in AI'],
    education: [
      'S1: Sistem Informasi, Institut Teknologi Sepuluh Nopember (ITS) (2006)',
      'S2: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (2011)',
      'S3: Computer Science & Health Informatics, Trinity College Dublin, Irlandia (2015)',
    ],
    researchFocus: 'Penalaran probabilitas (Bayesian Network), sistem pendukung keputusan klinis, dan informatika kesehatan.',
    description: 'Doktor spesialis pemodelan ketidakpastian dan penalaran probabilistik menggunakan Bayesian Network. Fokus riset bimbingan berkisar pada sistem pendukung keputusan diagnosis medis dan informatika kesehatan.',
    email: 'retno@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'SHOLIQ': {
    shortName: 'SHOLIQ',
    fullName: 'Prof. Drs. ec. Ir. SHOLIQ, M.Kom.',
    lab: 'MSI',
    role: 'Guru Besar / Peneliti Senior Manajemen Sistem Informasi',
    expertise: ['Enterprise Architecture Modeling', 'Accounting & Financial Information Systems', 'Systems Analysis & Design', 'Strategic IT Management'],
    education: [
      'S1: Teknik Elektro (Ir.) / Ilmu Ekonomi (Drs. ec.) (1989)',
      'S2: Magister Ilmu Komputer (M.Kom.) (1998)',
      'S3: Doktor Sistem Informasi (2010)',
    ],
    researchFocus: 'Pemodelan arsitektur enterprise, sistem informasi keuangan dan akuntansi korporat, serta keselarasan proses bisnis TI.',
    description: 'Guru Besar berlatar belakang ganda Teknik dan Ilmu Ekonomi. Sangat ahli dalam pemodelan sistem informasi enterprise, perancangan sistem informasi keuangan organisasi, serta analisis keselarasan arsitektur bisnis.',
    email: 'sholiq@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Wiwik Anggraeni': {
    shortName: 'Wiwik Anggraeni',
    fullName: 'Wiwik Anggraeni, S.Si., M.Kom.',
    lab: 'RDIB',
    role: 'Dosen / Peneliti Rekayasa Data & Inteligensi Bisnis',
    expertise: ['Time Series Forecasting', 'Computational Statistics', 'Predictive Modeling', 'Machine Learning for Health & Business'],
    education: [
      'S1: Statistika, Institut Teknologi Sepuluh Nopember (ITS) (1993)',
      'S2: Teknik Informatika, Institut Teknologi Sepuluh Nopember (ITS) (2001)',
    ],
    researchFocus: 'Pemodelan deret waktu (Time Series Forecasting), statistika komputasi, dan pemodelan prediktif epidemiologi serta finansial.',
    description: 'Pakar statistika komputasi dan pemodelan deret waktu (Time Series Forecasting). Riset bimbingannya banyak menghasilkan model prediksi tren epidemiologi penyakit, tren finansial, serta peramalan kebutuhan energi.',
    email: 'wiwik@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
  'Tony Dwi Susanto': {
    shortName: 'Tony Dwi Susanto',
    fullName: 'Tony Dwi Susanto, S.T., M.T., Ph.D.',
    lab: 'MSI',
    role: 'Dosen / Peneliti Manajemen Sistem Informasi (MSI)',
    expertise: ['Digital Government / SPBE', 'Smart Cities', 'IT Management & Governance', 'Technology Adoption'],
    education: [
      'S1: Teknik Nuklir, Universitas Gadjah Mada (UGM) (1993)',
      'S2: Teknik Elektro / Sistem Komputer, Universitas Gadjah Mada (UGM) (2000)',
      'S3: Computer Science, Flinders University, Australia (2008)',
    ],
    researchFocus: 'Transformasi digital pemerintahan (e-Gov/SPBE), arsitektur smart city, adopsi teknologi, dan sertifikasi ITIL/COBIT/TOGAF.',
    description: 'Pakar e-Government dan Smart City terkemuka di Indonesia, konsultan kementerian & pemda, serta pendiri Tatacipta Teknologi Indonesia (TaTI). Pengampu mata kuliah Manajemen dan Operasional Sistem Informasi (ES255103) di S2 SI ITS.',
    email: 'tony@is.its.ac.id',
    profileUrl: 'https://www.its.ac.id/si/en/dosen-staff/daftar-dosen/',
  },
};

export interface LabInfo {
  code: LabCode;
  name: string;
  englishName: string;
  focus: string;
  color: number;
  emoji: string;
}

export const LAB_INFOS: Record<string, LabInfo> = {
  RDIB: {
    code: 'RDIB',
    name: 'Rekayasa Data dan Inteligensi Bisnis',
    englishName: 'Data Engineering and Business Intelligence',
    focus: 'Big Data, Data Science, Artificial Intelligence, Business Intelligence, Machine Learning & Analytics',
    color: 0x2b2d31,
    emoji: 'RDIB',
  },
  MSI: {
    code: 'MSI',
    name: 'Manajemen Sistem Informasi',
    englishName: 'Information Systems Management',
    focus: 'IT Governance, IT Strategy & Alignment, Enterprise Architecture, Information Management, Digital Transformation',
    color: 0x2b2d31,
    emoji: 'MSI',
  },
  SE: {
    code: 'SE',
    name: 'Sistem Enterprise',
    englishName: 'Enterprise Systems',
    focus: 'Enterprise Resource Planning (ERP), Business Process Management (BPM), System Dynamics, Simulation, Supply Chain',
    color: 0x2b2d31,
    emoji: 'SE',
  },
  IKTI: {
    code: 'IKTI',
    name: 'Infrastruktur dan Keamanan Teknologi Informasi',
    englishName: 'IT Infrastructure and Security',
    focus: 'Cybersecurity, Cloud Infrastructure, Network Security, IoT, Information Security Auditing',
    color: 0x2b2d31,
    emoji: 'IKTI',
  },
  ADDI: {
    code: 'ADDI',
    name: 'Akuisisi Data dan Diseminasi Informasi',
    englishName: 'Data Acquisition and Dissemination of Information',
    focus: 'Linked Open Data, Semantic Web, Data Acquisition, Open Data Architecture, Knowledge Graphs',
    color: 0x2b2d31,
    emoji: 'ADDI',
  },
};

export interface CourseSchedule {
  code: string;
  name: string;
  classGroup: string;
  lecturers: string[];
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  time: string;
  room: string;
}

export const COURSE_SCHEDULES: CourseSchedule[] = [
  {
    code: 'ES255102',
    name: 'Pengembangan dan Penerapan Sistem',
    classGroup: 'A',
    lecturers: ['Dr. Ir. Aris Tjahyanto, M.Kom.', 'Tim Dosen Departemen SI'],
    day: 'Selasa',
    time: '09:40 - 12:10 WIB',
    room: 'Ruang Kuliah Pascasarjana SI',
  },
  {
    code: 'ES255101',
    name: 'Infrastruktur Teknologi Informasi',
    classGroup: 'A',
    lecturers: ['Dr.Eng. Febriliyan Samopa, S.Kom., M.Kom.'],
    day: 'Rabu',
    time: '07:00 - 09:30 WIB',
    room: 'SI 2102 S2',
  },
  {
    code: 'ES255104',
    name: 'Manajemen Data, Informasi dan Konten',
    classGroup: 'A',
    lecturers: ['Prof. Nur Aini Rakhmawati, S.Kom., M.Sc.Eng., Ph.D.'],
    day: 'Rabu',
    time: '09:40 - 12:10 WIB',
    room: 'SI 2102 S2',
  },
  {
    code: 'ES255103',
    name: 'Manajemen dan Operasional Sistem Informasi',
    classGroup: 'A',
    lecturers: ['Tony Dwi Susanto, S.T., M.T., Ph.D.'],
    day: 'Kamis',
    time: '07:00 - 09:30 WIB',
    room: 'SI 1302',
  },
];

export interface StudentRecord {
  nrp: string;
  name: string;
  advisor: string;
  lab: 'RDIB' | 'MSI' | 'SE' | 'IKTI' | 'ADDI';
  discordId?: string;
  thesisTopic?: string;
  expertise?: string;
}

/**
 * Sample student data for public open-source repository.
 * In production/deployment, full cohort data is loaded securely via process.env.STUDENTS_DATA
 * or local private storage in data/students.json (git-ignored).
 */
export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    nrp: '5026201001',
    name: 'Mahasiswa Contoh A',
    advisor: 'Ahmad Muklason',
    lab: 'RDIB',
    expertise: 'Data Engineering & Business Intelligence',
  },
  {
    nrp: '5026201002',
    name: 'Mahasiswa Contoh B',
    advisor: 'Tony Dwi Susanto',
    lab: 'MSI',
    expertise: 'IT Governance & Enterprise Architecture',
  },
];
