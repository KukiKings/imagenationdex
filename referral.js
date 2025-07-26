(async function trackReferral() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  const wallet = window.solana?.publicKey?.toString();

  if (ref && wallet && ref !== wallet) {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .insert([{ referrer: ref, referred: wallet }]);

      if (!error) console.log("Referral tracked:", ref, "→", wallet);
    } catch (err) {
      console.error("Referral error:", err);
    }
  }

  const shareBtn = document.getElementById("shareReferral");
  if (shareBtn && wallet) {
    shareBtn.onclick = () => {
      const url = `${window.location.origin}?ref=${wallet}`;
      navigator.clipboard.writeText(url);
      alert("Referral link copied to clipboard! 🔗");
    };
  }
})();