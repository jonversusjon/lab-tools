import React, { useState, useMemo } from "react";
    
import { ArrowRight } from "lucide-react";

/**
 * SerialDilutionCalculator – pure‑JSX version (no TypeScript).
 *
 * ● Calculates full serial‑dilution volumes with unit conversion (µM ↔︎ mg/mL) when a molar mass is supplied.
 * ● Validates inputs and renders a protocol table you can copy straight into a lab notebook.
 * ● Built with shadcn/ui + Tailwind; tweak styling as desired.
 */
export default function SerialDilutionCalculator() {
  /* ──────────────── State ──────────────── */
  const [stockName, setStockName] = useState("");
  const [diluentName, setDiluentName] = useState("");

  const [stockConc, setStockConc] = useState("");
  const [stockUnit, setStockUnit] = useState("µM");

  const [initConc, setInitConc] = useState("");
  const [initUnit, setInitUnit] = useState("µM");
  const [molarMass, setMolarMass] = useState(""); // g/mol

  const [finalVol, setFinalVol] = useState("");
  const [finalVolUnit, setFinalVolUnit] = useState("µL");

  const [dilutionFactor, setDilutionFactor] = useState("");
  const [numDilutions, setNumDilutions] = useState("");
  const [replicates, setReplicates] = useState("1");

  const [errors, setErrors] = useState([]);

  /* ────────────── Helpers ────────────── */
  const parseNum = (val) => (val.trim() === "" ? NaN : parseFloat(val));

  const convertVolumeToUL = (v, unit) => (unit === "µL" ? v : v * 1000);

  /* ───────────── Calculation ──────────── */
  const results = useMemo(() => {
    const convertToMicroMolar = (value, unit) => {
        if (unit === "µM") return value;
        if (unit === "mg/mL") {
          const mm = parseNum(molarMass);
          if (!mm || mm <= 0) return null;
          return (value * 1e6) / mm; // µM from mg/mL
        }
        return null;
      };

    const errs = [];

    const C_stock_raw = parseNum(stockConc);
    const C_init_raw = parseNum(initConc);
    const DF_raw = parseNum(dilutionFactor);
    const V_final_raw = parseNum(finalVol);
    const N_raw = parseInt(numDilutions, 10);
    const R_raw = parseInt(replicates, 10) || 1;

    if ([C_stock_raw, C_init_raw, DF_raw, V_final_raw, N_raw].some((n) => isNaN(n) || n <= 0)) {
      errs.push("All numeric fields must be valid positive numbers.");
    }

    const C_stock = convertToMicroMolar(C_stock_raw, stockUnit);
    const C_init = convertToMicroMolar(C_init_raw, initUnit);
    const V_final = convertVolumeToUL(V_final_raw, finalVolUnit);

    if (C_stock === null || C_init === null) errs.push("Provide a valid molar mass for unit conversion.");
    if (C_init > C_stock) errs.push("Initial concentration cannot exceed stock concentration.");
    if (DF_raw < 1.0001) errs.push("Dilution factor must be > 1.");

    setErrors(errs);
    if (errs.length) return [];

    const calcStep = (C_source, C_target) => {
      const Vs = (C_target / C_source) * V_final; // µL
      const Vd = V_final - Vs;
      return { Vs, Vd };
    };

    const out = [];

    // Step 1 (from stock)
    const step0 = calcStep(C_stock, C_init);
    out.push({
      step: 1,
      concentration: C_init,
      transfer: step0.Vs * R_raw,
      diluent: step0.Vd * R_raw,
      source: stockName || "Stock",
    });

    // Subsequent serial steps
    for (let i = 1; i < N_raw; i += 1) {
      const prevConc = out[i - 1].concentration;
      const nextConc = prevConc / DF_raw;
      const vols = calcStep(prevConc, nextConc);
      out.push({
        step: i + 1,
        concentration: nextConc,
        transfer: vols.Vs * R_raw,
        diluent: vols.Vd * R_raw,
        source: `Dilution ${i}`,
      });
    }
    return out;
  }, [stockConc, stockUnit, initConc, initUnit, finalVol, finalVolUnit, dilutionFactor, numDilutions, replicates, stockName, molarMass]);

  /* ──────────────── UI ──────────────── */
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold tracking-tight"
      >
        Serial Dilution Calculator & Planner
      </motion.h1>

      {/* Input grid */}
      <Card className="bg-white/5 backdrop-blur-md">
        <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
          <Input placeholder="Stock solution name" value={stockName} onChange={(e) => setStockName(e.target.value)} />
          <Input placeholder="Diluent name" value={diluentName} onChange={(e) => setDiluentName(e.target.value)} />

          {/* Stock conc */}
          <div className="flex items-center gap-2">
            <Input type="number" className="flex-1" placeholder="Stock conc." value={stockConc} onChange={(e) => setStockConc(e.target.value)} />
            <Select value={stockUnit} onValueChange={setStockUnit}>
              <SelectTrigger className="w-24" />
              <SelectContent>
                <SelectItem value="µM">µM</SelectItem>
                <SelectItem value="mg/mL">mg/mL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Initial conc */}
          <div className="flex items-center gap-2">
            <Input type="number" className="flex-1" placeholder="Initial conc." value={initConc} onChange={(e) => setInitConc(e.target.value)} />
            <Select value={initUnit} onValueChange={setInitUnit}>
              <SelectTrigger className="w-24" />
              <SelectContent>
                <SelectItem value="µM">µM</SelectItem>
                <SelectItem value="mg/mL">mg/mL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {stockUnit !== initUnit && (
            <Input type="number" placeholder="Molar mass (g/mol)" value={molarMass} onChange={(e) => setMolarMass(e.target.value)} />
          )}

          {/* Final volume */}
          <div className="flex items-center gap-2">
            <Input type="number" className="flex-1" placeholder="Final vol." value={finalVol} onChange={(e) => setFinalVol(e.target.value)} />
            <Select value={finalVolUnit} onValueChange={setFinalVolUnit}>
              <SelectTrigger className="w-24" />
              <SelectContent>
                <SelectItem value="µL">µL</SelectItem>
                <SelectItem value="mL">mL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input type="number" placeholder="Dilution factor" value={dilutionFactor} onChange={(e) => setDilutionFactor(e.target.value)} />
          <Input type="number" placeholder="Number of dilutions" value={numDilutions} onChange={(e) => setNumDilutions(e.target.value)} />
          <Input type="number" placeholder="Replicates (optional)" value={replicates} min={1} onChange={(e) => setReplicates(e.target.value)} />
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <ul className="list-disc space-y-1 rounded bg-red-500/10 p-4 text-sm text-red-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {/* Results */}
      {results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-3 py-2 text-left">Step</th>
                <th className="px-3 py-2 text-left">Conc. (µM)</th>
                <th className="px-3 py-2 text-left">Transfer (µL)</th>
                <th className="px-3 py-2 text-left">Diluent (µL)</th>
                <th className="px-3 py-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.step} className={row.step % 2 === 0 ? "bg-white/5" : "bg-white/10"}>
                  <td className="px-3 py-2">{row.step}</td>
                  <td className="px-3 py-2">{row.concentration.toFixed(3)}</td>
                  <td className="px-3 py-2">{row.transfer.toFixed(1)}</td>
                  <td className="px-3 py-2">{row.diluent.toFixed(1)}</td>
                  <td className="px-3 py-2">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <Button onClick={() => { if (results.length === 0) setErrors(["Please fill in all required fields correctly."]); }} className="flex items-center gap-2">
        Calculate Serial Dilution <ArrowRight size={16} />
      </Button>
    </div>
  );
}
