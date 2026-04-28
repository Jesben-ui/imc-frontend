import { Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,   
  LineElement,    
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,   
  LineElement,    
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);
function App() {
  const [form, setForm] = useState({
    poids: "",
    taille: "",
    age: "",
    sexe: "M",
  });

  const [stats, setStats] = useState(null);
  const [allData, setAllData] = useState([]);
  const [result, setResult] = useState(null);
  const [poids, setPoids] = useState(80);
  const [taille, setTaille] = useState(180);

  const total = allData.length || 1;

  const countMaigre = allData.filter(d => d.categorie === "Maigre").length;
  const countNormal = allData.filter(d => d.categorie === "Normal").length;
  const countSurpoids = allData.filter(d => d.categorie === "Surpoids").length;
  const countObese = allData.filter(d => d.categorie === "Obèse").length;

  // pourcentages

  const pObese = (countObese/total)*100;
  const pNormal = (countNormal/total)*100;
  const pSurpoids = (countSurpoids/total)*100;
  const pMaigre = (countMaigre/total)*100;

    //message

  let message =" ";

  if(pObese >40)
  {
    message = "Attention: forte proportion de personnes obèses dans la population.";
  }
  else if(pSurpoids >40)
  {
    message = "La population présente une tendance au surpoids";
  }
  else if(pNormal >50)
  {
    message = "Bonne situation: majorité des personnes avec un IMC normal";
  }
  else if(pMaigre >40)
  {
    message = "Attention: proportion élevée de personnes maigres.";
  }
  else
  {
    message ="Répartition équilibrée de l'IMC de la population";
  }



  // -----------------------
  // ENVOI DONNÉES (POST)
  // -----------------------
 const sendData = async (e) => {
  e.preventDefault();

  console.log("CLICK OK");

  try {
    const res = await fetch("https://supportive-determination-production.up.railway.app/imc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      throw new Error("Erreur serveur Flask");
    }

    const data = await res.json();
    console.log("Réponse backend :", data);

    //  1. VIDER LE FORMULAIRE
    setForm({
      poids: "",
      taille: "",
      age: "",
      sexe: "M",
    });

    //  2. RAFRAÎCHIR LES DONNÉES
    await loadStats();
    await loadAll();

    setResult(data);

  } catch (error) {
    console.error("Erreur fetch :", error);
  }
};

  // -----------------------
  // STATS GLOBAL (GET)
  // -----------------------
  const loadStats = async () => {
    const res = await fetch("https://supportive-determination-production.up.railway.app/stats");
    const data = await res.json();
    setStats(data);
  };

  // -----------------------
  // DONNÉES POUR GRAPHIQUES
  // -----------------------
  const loadAll = async () => {
    const res = await fetch("https://supportive-determination-production.up.railway.app/all");
    const data = await res.json();
    setAllData(data);
  };

  useEffect(() => {
    loadStats();
    loadAll();
  }, []);

  // -----------------------
  // GRAPH CATÉGORIES
  // -----------------------
  const imcData = {
    labels: ["Maigre","Normal","Surpoids","Obèse"],
    datasets: [
      {
        label:"IMC",
        data: [countMaigre, countNormal, countSurpoids, countObese],
        backgroundColor:["#60a5fa", "#34d399", "#fbbf24", "#ef4444"],

      },
    ],
  };

const xValues = allData.map((d) => Number(d.poids));
const yValues = allData.map((d) => Number(d.taille));

const n = xValues.length;

let sumX = 0;
let sumY = 0;
let sumXY = 0;
let sumXX = 0;

for (let i = 0; i < n; i++) {
  sumX += xValues[i];
  sumY += yValues[i];
  sumXY += xValues[i] * yValues[i];
  sumXX += xValues[i] * xValues[i];
}

// Protection contre la division par zéro
const denominator = n * sumXX - sumX * sumX;
const a = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
const b = (sumY - a * sumX) / n;

// fonction estimation
const estimationTaille = (poids) => {
  return (a * poids + b).toFixed(1);
};

// fonction estimation poids (inverse de la régression)
const estimationPoids = (taille) => {
  if (a === 0) return "N/A"; // Éviter division par zéro
  return ((taille - b) / a).toFixed(2);
};

// -----------------------
// COURBE TAILLE EN FONCTION DU POIDS 
// -----------------------
const regressionData = {
  datasets: [
    {
      label: "Données réelles",
      data: allData.map((d) => ({
        x: Number(d.poids),
        y: Number(d.taille),
      })),
      backgroundColor: "#6366f1",
      pointRadius: 5,
      showLine: false,
    },

    xValues.length > 0 && {
      label: "Régression linéaire",
      data: [
        {
          x: Math.min(...xValues),
          y: a * Math.min(...xValues) + b,
        },
        {
          x: Math.max(...xValues),
          y: a * Math.max(...xValues) + b,
        },
      ],
      borderColor: "#ef4444",
      borderWidth: 3,
      showLine: true,
      fill: false,
      pointRadius: 0,
      type: "line",
    },
  ].filter(Boolean), // Enlève les valeurs false
};

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📊 CALCUL IMC</h1>

      {/* FORM */}
      <div style={styles.card}>
        <h2>COLLECTE DE DONNÉES</h2>

        <input
          placeholder="Poids(en Kg, ex:76)"
          value ={form.poids}
          onChange={(e) => setForm({ ...form, poids : e.target.value })}
          style={styles.input}
        />

        <input
          placeholder="Taille(en cm,ex: 180)"
          value ={form.taille}
          onChange={(e) => setForm({ ...form, taille : e.target.value })}
          style={styles.input}
        />

        <input
          placeholder="âge(ex:35)"
          value ={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          style={styles.input}
        />

        <select
          style={styles.input}
          onChange={(e) => setForm({ ...form, sexe: e.target.value })}
        >
          <option value="M">Homme</option>
          <option value="F">Femme</option>
        </select>

        <button style={styles.button} onClick={sendData}>Envoyer</button>
        {result && (
  <div style={{
    marginTop: "15px",
    padding: "15px",
    background: "#f1f5f9",
    borderRadius: "10px",
    textAlign: "center",
    width:"80%",
    margin:"auto"
  }}>
    <h3>Votre IMC : {result.imc}</h3>
    <p>Catégorie : {result.categorie}</p>
  </div>
)}
      </div>

      {/* STATS */}
      {stats && (
  <div style={styles.statsGrid}>
    <div style={styles.statCard}>📈 Moyenne IMC: {stats.moyenne}</div>
    <div style={styles.statCard}>📊 Médiane: {stats.mediane}</div>
    <div style={styles.statCard}>📉 Variance: {stats.variance}</div>
    <div style={styles.statCard}>📏 Écart-type: {stats.ecart_type}</div>
    <div style={styles.statCard}>⬆️ Max: {stats.max}</div>
    <div style={styles.statCard}>⬇️ Min: {stats.min}</div>
    <div style={styles.statCard}>👥 Total: {stats.total}</div>
  </div>
)}

      <div style={styles.card}>
        <h3>ESTIMATION D'UNE TAILLE CONNAISSANT LE POIDS</h3>
      {/*champ pour que l'utilisateur entre son poids*/}
         <label>
           Entrez votre poids(kg):
           <input 
            type="number"
            value={poids}
            onChange={(e) => setPoids(Number(e.target.value))}
            style={{marginLeft:"10px",padding:"5px"}}
           />
         </label>
  <p>
    Pour un poids de <strong>{poids} kg</strong>,
    la taille estimée est :
    <strong> {estimationTaille(poids)} cm</strong>
  </p>
   <p>
    Équation de la droite de Régression linéaire:
    <strong>
      y = {a.toFixed(1)}x + {b.toFixed(1)}
    </strong>
  </p>
</div>
      
      <div style={styles.card}>
        <h3>ESTIMATION DU POIDS CONNAISSANT LA TAILLE</h3>
      {/*champ pour que l'utilisateur entre sa taille*/}
        <label>
           Entrez votre taille(cm):
           <input 
            type="number"
            value={taille}
            onChange={(e) => setTaille(Number(e.target.value))}
            style={{marginLeft:"10px",padding:"5px"}}
           />
         </label>
  <p>
    Pour une taille de <strong>{taille} cm</strong>,
    le poids estimée est :
    <strong> {estimationPoids(taille)} kg</strong>
  </p>
  <p>
    Équation de la droite de Régression linéaire:
    <strong>
      y = {a.toFixed(2)}x + {b.toFixed(2)}
    </strong>
  </p>
</div>

      {/* GRAPHS */}
      <div style={styles.graphGrid}>
        <div style={styles.card}>
          <h3>NUAGE DE POINTS DE LA TAILLE EN FONCTION DU POIDS</h3>
          <Line
  data={regressionData}
  options={{
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    scales: {
      x: {
        type: "linear",
        title: {
          display: true,
          text: "Poids (kg)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Taille (cm)",
        },
      },
    },
  }}
/>
        </div>

        <div style={styles.card}>
          <h3>CAMEMBERT DES ETATS</h3>
          <Pie
    key={allData.length}
    data={imcData}
    options={{
      plugins: {
        legend: {
         display:true,
         position:"bottom"
      },
          Tooltip: {
            callbacks:{
             label: function (context) {
              return `IMC: ${context.raw}`;
            },
          },
        },
      },
        scales: {
          y: {
            beginAtZero: true,
        },
      },
    }}
  />

          {/* SYNTHESE */}
          {allData.length > 0 &&(
            <div style = {{
              marginTop: "15px",
              padding: "15px",
              borderRadius:"10px",
              background: "#f8fafc",
              color:"#111",
              textAlign:"center",
              fontWeight: "bold"
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------
// STYLE PRO DASHBOARD
// -----------------------
const styles = {
  page: {
    padding: "20px",
    fontFamily: "Arial",
    background: "linear-gradient(135deg,#667eea,#764ba2)",
    minHeight: "100vh",
    color: "white",
    width:80%,
    margin:"auto",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  card: {
    background: "white",
    color: "black",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
  },
  input: {
    display: "block",
    width: "100%",
    margin: "10px 0",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    width: "100%",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,1fr)",
    gap: "10px",
    marginBottom: "20px",
  },
  statCard: {
    background: "white",
    color: "black",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
  },
  graphGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,1fr)",
    gap: "20px",
  },
form:{
  width:60%,
  margin:"auto",
  padding:"20px",
},

};

export default App;
