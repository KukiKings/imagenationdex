// Countdown
const countdown = document.getElementById("countdown");
const launchDate = new Date("2025-07-28T00:00:00Z").getTime();
setInterval(() => {
  const now = new Date().getTime();
  const distance = launchDate - now;
  if (distance < 0) {
    countdown.innerHTML = "🚀 We Are Live!";
    return;
  }
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  countdown.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}, 1000);

// Wallet Connect (Mock)
const connectBtn = document.getElementById("connectWallet");
const mintBtn = document.getElementById("mintNFT");
const xpVault = document.getElementById("xpVault");

connectBtn.onclick = () => {
  connectBtn.innerText = "Wallet Connected ✅";
  mintBtn.style.display = "inline-block";
  xpVault.style.display = "block";
};

// Mint NFT (Mock)
mintBtn.onclick = () => {
  alert("NFT Badge Minted 🏅");
  document.getElementById("xpAmount").innerText = "100";
};