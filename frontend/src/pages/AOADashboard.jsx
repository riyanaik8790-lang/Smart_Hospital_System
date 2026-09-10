import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";

function AOADashboard() {

  const [data,setData] = useState({
    labels:["Priority Scheduling","Doctor Search","Room Search"],
    datasets:[{
      label:"Execution Time (ms)",
      data:[0,0,0]
    }]
  });

  useEffect(()=>{

    const interval = setInterval(async ()=>{

      const res = await fetch("/aoa-performance");
      const logs = await res.json();

      const times = logs.map(l => parseFloat(l.time));

      setData({
        labels: logs.map(l=>l.algorithm),
        datasets:[{
          label:"Execution Time (ms)",
          data:times
        }]
      });

    },2000);

    return ()=>clearInterval(interval)

  },[])

  return(

    <div style={{padding:"30px"}}>

      <h2>AOA Performance Dashboard</h2>

      <div style={{display:"flex",gap:"20px",marginTop:"20px"}}>

        <div className="card">
          <h3>Priority Scheduling</h3>
          <p>Complexity: O(log n)</p>
        </div>

        <div className="card">
          <h3>Doctor Search</h3>
          <p>Complexity: O(n)</p>
        </div>

        <div className="card">
          <h3>Room Search</h3>
          <p>Complexity: O(n)</p>
        </div>

      </div>

      <div style={{marginTop:"40px",width:"600px"}}>

        <Bar data={data} />

      </div>

    </div>
  )

}

export default AOADashboard;