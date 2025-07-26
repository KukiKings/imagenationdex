(async function loadLeaderboard() {
  try {
    const { data, error } = await supabase
      .from("referrals")
      .select("referrer, count:referred")
      .group("referrer")
      .order("count", { ascending: false })
      .limit(5);

    const board = document.getElementById("leaderboard");
    data.forEach((row, i) => {
      const li = document.createElement("li");
      li.textContent = `#${i + 1}: ${row.referrer.slice(0, 8)}... - ${row.count} XP`;
      board.appendChild(li);
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
  }
})();