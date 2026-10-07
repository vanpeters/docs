export const BudgetTracker = () => {
  const [budgets, setBudgets] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [txInputs, setTxInputs] = useState({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("budget-tracker");
      if (saved) setBudgets(JSON.parse(saved));
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem("budget-tracker", JSON.stringify(budgets));
    } catch (e) {}
  }, [budgets, loaded]);

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const money = (n) => "$" + Number(n).toFixed(2);

  const addBudget = (e) => {
    e.preventDefault();
    const amount = parseFloat(limit);
    if (!name.trim() || isNaN(amount) || amount <= 0) return;
    setBudgets([...budgets, { id: newId(), name: name.trim(), limit: amount, transactions: [] }]);
    setName("");
    setLimit("");
  };

  const deleteBudget = (id) => {
    if (!window.confirm("Delete this budget and all its transactions?")) return;
    setBudgets(budgets.filter((b) => b.id !== id));
  };

  const updateTxInput = (id, field, value) => {
    setTxInputs({ ...txInputs, [id]: { ...(txInputs[id] || {}), [field]: value } });
  };

  const addTransaction = (e, id) => {
    e.preventDefault();
    const input = txInputs[id] || {};
    const amount = parseFloat(input.amount);
    if (isNaN(amount) || amount <= 0) return;
    setBudgets(
      budgets.map((b) =>
        b.id === id
          ? {
              ...b,
              transactions: [
                ...b.transactions,
                { id: newId(), amount, note: (input.note || "").trim(), date: new Date().toLocaleDateString() },
              ],
            }
          : b
      )
    );
    setTxInputs({ ...txInputs, [id]: { amount: "", note: "" } });
  };

  const deleteTransaction = (budgetId, txId) => {
    setBudgets(
      budgets.map((b) =>
        b.id === budgetId ? { ...b, transactions: b.transactions.filter((t) => t.id !== txId) } : b
      )
    );
  };

  const clearAll = () => {
    if (!window.confirm("Delete ALL budgets and transactions?")) return;
    setBudgets([]);
  };

  const inputClass =
    "px-3 py-2 rounded-lg border border-zinc-950/20 dark:border-white/20 bg-transparent text-sm text-zinc-950 dark:text-white";
  const primaryBtn = "px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium";
  const deleteBtn =
    "px-2 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 border border-red-600/30 hover:bg-red-600/10";

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.transactions.reduce((t, x) => t + x.amount, 0), 0);

  return (
    <div className="not-prose p-4 border border-zinc-950/10 dark:border-white/10 rounded-2xl space-y-4">
      <form onSubmit={addBudget} className="flex flex-wrap gap-2">
        <input className={inputClass + " flex-1 min-w-[140px]"} placeholder="Budget name (e.g. Groceries)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputClass + " w-32"} type="number" min="0" step="0.01" placeholder="Limit" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <button type="submit" className={primaryBtn}>Add budget</button>
      </form>

      <div className="flex flex-wrap justify-between items-center text-sm text-zinc-950/70 dark:text-white/70">
        <span>
          Total spent: <strong>{money(totalSpent)}</strong> of {money(totalLimit)} · Remaining:{" "}
          <strong className={totalLimit - totalSpent < 0 ? "text-red-600" : ""}>{money(totalLimit - totalSpent)}</strong>
        </span>
        {budgets.length > 0 && (
          <button onClick={clearAll} className={deleteBtn}>Delete all</button>
        )}
      </div>

      {budgets.length === 0 && (
        <p className="text-sm text-zinc-950/60 dark:text-white/60">No budgets yet. Add one above to get started.</p>
      )}

      {budgets.map((b) => {
        const spent = b.transactions.reduce((s, t) => s + t.amount, 0);
        const remaining = b.limit - spent;
        const pct = Math.min(100, b.limit > 0 ? (spent / b.limit) * 100 : 0);
        const input = txInputs[b.id] || { amount: "", note: "" };
        return (
          <div key={b.id} className="p-4 rounded-xl border border-zinc-950/10 dark:border-white/10 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-semibold text-zinc-950 dark:text-white">{b.name}</div>
                <div className="text-sm text-zinc-950/70 dark:text-white/70">
                  {money(spent)} spent of {money(b.limit)} ·{" "}
                  <span className={remaining < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                    {money(remaining)} left
                  </span>
                </div>
              </div>
              <button onClick={() => deleteBudget(b.id)} className={deleteBtn}>Delete budget</button>
            </div>

            <div className="h-2 rounded-full bg-zinc-950/10 dark:bg-white/10 overflow-hidden">
              <div className={"h-full " + (remaining < 0 ? "bg-red-600" : "bg-green-600")} style={{ width: pct + "%" }} />
            </div>

            <form onSubmit={(e) => addTransaction(e, b.id)} className="flex flex-wrap gap-2">
              <input className={inputClass + " w-28"} type="number" min="0" step="0.01" placeholder="Amount" value={input.amount || ""} onChange={(e) => updateTxInput(b.id, "amount", e.target.value)} />
              <input className={inputClass + " flex-1 min-w-[120px]"} placeholder="Note (optional)" value={input.note || ""} onChange={(e) => updateTxInput(b.id, "note", e.target.value)} />
              <button type="submit" className={primaryBtn}>Add transaction</button>
            </form>

            {b.transactions.length > 0 && (
              <ul className="divide-y divide-zinc-950/10 dark:divide-white/10">
                {b.transactions.map((t) => (
                  <li key={t.id} className="flex justify-between items-center py-2 text-sm text-zinc-950/80 dark:text-white/80">
                    <span>
                      <strong>{money(t.amount)}</strong> {t.note && "· " + t.note}{" "}
                      <span className="text-zinc-950/50 dark:text-white/50">({t.date})</span>
                    </span>
                    <button onClick={() => deleteTransaction(b.id, t.id)} className={deleteBtn}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};
