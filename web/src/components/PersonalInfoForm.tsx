import React, { useState } from "react";
import PSQIForm from "./PSQIForm";

type Props = { onComplete: (data: any) => void };

export default function PersonalInfoForm({ onComplete }: Props) {
  const [form, setForm] = useState<any>({
    name: "",
    age: 30,
    sex: "male",
    site: "site_a",
    device_model: "model_x",
  });
  const [psqi, setPsqi] = useState<any>({
    psqi_c1: 1, psqi_c2: 1, psqi_c3: 1, psqi_c4: 1, psqi_c5: 1, psqi_c6: 0, psqi_c7: 1
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const psqi_global =
      psqi.psqi_c1+psqi.psqi_c2+psqi.psqi_c3+psqi.psqi_c4+psqi.psqi_c5+psqi.psqi_c6+psqi.psqi_c7;
    onComplete({ ...form, ...psqi, psqi_global });
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Personal Info</h2>
      <label> Name <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></label>
      <label> Age <input className="input" type="number" value={form.age} onChange={e=>setForm({...form,age:Number(e.target.value)})} /></label>
      <label> Sex
        <select className="input" value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}>
          <option>male</option><option>female</option><option>other</option>
        </select>
      </label>
      <label> Site <input className="input" value={form.site} onChange={e=>setForm({...form,site:e.target.value})} /></label>
      <label> Device Model <input className="input" value={form.device_model} onChange={e=>setForm({...form,device_model:e.target.value})} /></label>
      <PSQIForm value={psqi} onChange={setPsqi} />
      <div style={{marginTop:12}}><button className="button" type="submit">Save & Continue</button></div>
    </form>
  );
}
