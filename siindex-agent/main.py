"""
SIINDEX Desktop Agent — Main Entry Point
=========================================
The sovereign voice intelligence for IN$DEX citizens.

Usage:
  python main.py              # Full mode (voice + wake word + all features)
  python main.py --text       # Text-only (no microphone)
  python main.py --briefing   # Morning briefing then exit
  python main.py --no-hud     # Skip opening the browser HUD
"""

import argparse
import json
import os
import sys
import threading
import time
import webbrowser
from datetime import datetime
from pathlib import Path

# ── Load .env first, before any other imports ────────────────────
from dotenv import load_dotenv
load_dotenv()

# ── Rich terminal UI ─────────────────────────────────────────────
try:
    from rich.console import Console
    from rich.panel   import Panel
    from rich import print as rprint
    console = Console()
    RICH = True
except ImportError:
    console = None
    RICH = False

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# ── Core modules ─────────────────────────────────────────────────
from core.brain         import SIINDEXBrain
from core.memory        import CitizenMemory
from core.voice         import VoiceEngine
from core.indx          import get_indx_price, get_grand_synchronicity_countdown
from core.wake_word     import WakeWordEngine
from core.scheduler     import SIINDEXScheduler, parse_time
from core.supabase_sync import SupabaseSync
from core.vision        import VisionEngine
from core.price_alerts  import PriceAlertEngine
from actions.commands   import CommandHandler

SETTINGS_FILE  = BASE_DIR / "config" / "settings.json"
HUD_HTML       = BASE_DIR / "dashboard" / "hud.html"
HUD_STATE_FILE = Path("/tmp/siindex_hud.json")


# ── Helpers ──────────────────────────────────────────────────────
def cprint(text: str, style: str = ""):
    if RICH and console:
        console.print(text, style=style)
    else:
        print(text)

def load_settings() -> dict:
    if not SETTINGS_FILE.exists():
        cprint("✗ config/settings.json not found. Copy .env.example → .env and set your API key.")
        sys.exit(1)
    with open(SETTINGS_FILE) as f:
        s = json.load(f)
    # .env overrides settings.json
    if os.getenv("ANTHROPIC_API_KEY"):
        s["anthropic_api_key"] = os.getenv("ANTHROPIC_API_KEY")
    if os.getenv("SIINDEX_MODEL"):
        s["model"] = os.getenv("SIINDEX_MODEL")
    if os.getenv("SIINDEX_VOICE"):
        s.setdefault("voice", {})["tts_voice"] = os.getenv("SIINDEX_VOICE")
    return s

def validate_api_key(settings: dict) -> bool:
    key = settings.get("anthropic_api_key", "")
    return bool(key) and key != "YOUR_ANTHROPIC_API_KEY_HERE"

def write_hud_state(memory: CitizenMemory, mode: str, speech: str):
    cd = get_grand_synchronicity_countdown()
    state = {
        "citizen_name":    memory.citizen.get("name", "Citizen"),
        "citizen_id":      memory.citizen.get("citizen_id", ""),
        "balance_indx":    memory.citizen.get("balance_indx", 0.0),
        "wisdom_score":    memory.citizen.get("wisdom_score",  0),
        "indx_price":      get_indx_price(),
        "mode":            mode,
        "speech_text":     speech,
        "countdown_days":  cd["days"],
        "countdown_hours": cd["hours"],
        "gs_date":         "Sep 24, 2026",
    }
    try:
        HUD_STATE_FILE.write_text(json.dumps(state))
    except Exception:
        pass

def print_banner():
    if RICH and console:
        console.print(Panel.fit(
            "[bold cyan]  SIINDEX[/bold cyan] [dim]Sovereign Intelligence[/dim]\n"
            "[dim]Post-Quantum · Pacific-First · IN$DEX[/dim]",
            border_style="cyan"
        ))
    else:
        print("=" * 50)
        print("  SIINDEX — Sovereign Intelligence")
        print("  Post-Quantum · Pacific-First · IN$DEX")
        print("=" * 50)

def print_stats(memory: CitizenMemory, supabase: SupabaseSync):
    c  = memory.citizen
    cd = get_grand_synchronicity_countdown()
    db = "[green]DB ✓[/green]" if supabase.online else "[dim]DB offline[/dim]"
    if RICH and console:
        console.print(
            f"[dim]Citizen:[/dim] [bold]{c.get('name','—')}[/bold]  "
            f"[dim]INDX:[/dim] [cyan]{c.get('balance_indx',0):.4f}[/cyan]  "
            f"[dim]WS:[/dim] [yellow]{c.get('wisdom_score',0)}[/yellow]  "
            f"[dim]GS:[/dim] [gold1]{cd['days']}d {cd['hours']}h[/gold1]  "
            f"{db}"
        )
    else:
        sync = "DB ✓" if supabase.online else "offline"
        print(f"Citizen: {c.get('name','—')} | INDX: {c.get('balance_indx',0):.4f} | WS: {c.get('wisdom_score',0)} | {sync}")


# ── First-run setup ──────────────────────────────────────────────
def first_run_setup(memory, brain, voice, text_mode):
    cprint("\n[bold cyan]SIINDEX — First-time citizen setup[/bold cyan]\n" if RICH else "\nSIINDEX — First-time setup\n")
    voice.speak(
        "Welcome to SIINDEX. I am your sovereign intelligence. "
        "Let me set up your citizen profile. I'll ask a few quick questions."
    )
    for field, question in brain.onboard_citizen():
        cprint(f"\n[cyan]SIINDEX:[/cyan] {question}" if RICH else f"\nSIINDEX: {question}")
        voice.speak(question)
        if text_mode or not VoiceEngine.microphone_available():
            answer = input("You: ").strip()
        else:
            write_hud_state(memory, "listening", question)
            answer = voice.listen(timeout=10) or input("You: ").strip()
        if field == "domain" and answer and not answer.endswith(".indx"):
            answer = answer.split(".")[0] + ".indx"
        if answer:
            if field == "name":
                memory.update_citizen(name=answer)
            elif field == "nation":
                memory.update_citizen(nation=answer)
            elif field == "role":
                memory.update_citizen(role=answer)
            elif field == "domain":
                memory.update_citizen(web3_domain=answer, citizen_id=answer)

    name = memory.citizen.get("name", "Citizen")
    domain = memory.citizen.get("web3_domain", "")
    memory.update_citizen(joined_date=datetime.now().isoformat())
    cprint(f"\n[bold green]✓ Profile created[/bold green]: {name} · {domain}" if RICH else f"\n✓ {name} · {domain}")
    welcome = (
        f"Welcome to the Sovereign Economy, {name}. "
        f"Your identity is {domain}. "
        f"Grand Synchronicity is {get_grand_synchronicity_countdown()['days']} days away. "
        f"Let's build something historic."
    )
    voice.speak(welcome)
    write_hud_state(memory, "ready", welcome)


# ── Main conversation loop ────────────────────────────────────────
def conversation_loop(brain, memory, voice, commands, vision,
                      alerts, supabase, text_mode, wake_active):

    mic_ok   = VoiceEngine.microphone_available() and not text_mode
    mode_str = "text" if (text_mode or not mic_ok) else "voice + wake word" if wake_active else "voice"
    cprint(f"\n[dim]Mode: {mode_str} | 'quit' to exit | 'briefing' | 'alerts' | 'screen'[/dim]\n" if RICH else f"\nMode: {mode_str}\n")

    write_hud_state(memory, "ready", "SIINDEX online. Sovereign Intelligence active.")

    # ── Wake word callback ───────────────────────────────────────
    wake_triggered   = threading.Event()
    wake_phrase_seen = [""]

    def on_wake(phrase: str):
        cprint(f"\n[bold yellow]⚡ Wake word: '{phrase}'[/bold yellow]" if RICH else f"\n⚡ Wake: {phrase}")
        wake_phrase_seen[0] = phrase
        wake_triggered.set()

    if wake_active and mic_ok:
        wake_engine = WakeWordEngine(on_wake=on_wake)
        wake_engine.start()
        cprint("[dim]Say 'SIINDEX' or 'Hey SIINDEX' to activate — or press Enter[/dim]\n" if RICH else "Say 'SIINDEX' to activate\n")
    else:
        wake_engine = None

    while True:
        try:
            # ── Input: wake word OR Enter OR typed text ──────────
            if wake_active and mic_ok and wake_engine:
                # Wait for either Enter key or wake word
                cprint("[dim]⏎ Enter / say 'SIINDEX' / type:[/dim] " if RICH else "Enter / say SIINDEX / type: ", end="", flush=True)

                input_thread_result = [None]
                def read_input():
                    try:
                        input_thread_result[0] = input()
                    except EOFError:
                        input_thread_result[0] = "quit"

                input_thread = threading.Thread(target=read_input, daemon=True)
                input_thread.start()

                # Wait for either typed input or wake word
                while input_thread.is_alive() and not wake_triggered.is_set():
                    time.sleep(0.1)

                typed = input_thread_result[0]
                was_wake = wake_triggered.is_set()
                wake_triggered.clear()

                if typed is not None:
                    user_input_raw = typed.strip()
                else:
                    user_input_raw = ""  # wake word triggered, go to voice

            elif mic_ok:
                cprint("[dim]⏎ Enter to speak / type:[/dim] " if RICH else "Enter/type: ", end="", flush=True)
                user_input_raw = input().strip()
                was_wake = False
            else:
                user_input_raw = input("You: ").strip()
                was_wake = False

            # ── Handle quit ──────────────────────────────────────
            if user_input_raw.lower() in ("quit", "exit", "bye", "q"):
                break

            # ── Quick commands without Claude ────────────────────
            if user_input_raw.lower() == "briefing":
                user_input_raw = "morning briefing"
            elif user_input_raw.lower() == "alerts":
                resp = alerts.format_active_alerts()
                cprint(f"\n[cyan]SIINDEX:[/cyan] {resp}" if RICH else f"\nSIINDEX: {resp}")
                voice.speak_async(resp)
                continue
            elif user_input_raw.lower() in ("screen", "vision", "what do you see"):
                user_input_raw = "what am I looking at"

            # ── Voice capture if Enter pressed with no text ───────
            if mic_ok and not user_input_raw:
                write_hud_state(memory, "listening", "Listening…")
                cprint("[yellow]🎤 Listening…[/yellow]" if RICH else "🎤 Listening…")
                user_input = voice.listen(timeout=8)
                if not user_input:
                    cprint("[dim]  (nothing heard)[/dim]" if RICH else "  (nothing heard)")
                    write_hud_state(memory, "ready", "Nothing heard.")
                    continue
            else:
                user_input = user_input_raw

            cprint(f"\n[bold white]You:[/bold white] {user_input}" if RICH else f"\nYou: {user_input}")

            # ── Price alert command? ──────────────────────────────
            tl = user_input.lower()
            if any(w in tl for w in ["alert me", "tell me when indx", "notify me when"]):
                new_alert = alerts.parse_voice_command(user_input)
                if new_alert:
                    resp = f"Alert set. I'll tell you when INDX goes {new_alert.direction} ${new_alert.target:.2f}."
                    cprint(f"\n[cyan]SIINDEX:[/cyan] {resp}" if RICH else f"\nSIINDEX: {resp}")
                    voice.speak_async(resp)
                    continue
                else:
                    resp = "I didn't catch the price level. Try: 'alert me when INDX hits $0.50'"
                    cprint(f"\n[cyan]SIINDEX:[/cyan] {resp}" if RICH else f"\nSIINDEX: {resp}")
                    voice.speak_async(resp)
                    continue

            # ── Vision command? ───────────────────────────────────
            if any(phrase in tl for phrase in VisionEngine.vision_trigger_phrases()):
                write_hud_state(memory, "thinking", "Analysing your screen…")
                cprint("\n[dim]📷 Capturing screen…[/dim]" if RICH else "\n📷 Capturing screen…")
                resp = vision.describe_screen(user_input)
                cprint(f"\n[cyan]SIINDEX:[/cyan] {resp}" if RICH else f"\nSIINDEX: {resp}")
                write_hud_state(memory, "speaking", resp)
                voice.speak_async(resp)
                write_hud_state(memory, "ready", resp)
                continue

            # ── Supabase sync on balance/rank queries ────────────
            if any(w in tl for w in ["my balance", "my rank", "my wisdom", "sync", "update my"]):
                write_hud_state(memory, "thinking", "Syncing with IN$DEX…")
                synced = supabase.sync_to_memory(memory)
                if not synced:
                    cprint("[dim]  (Supabase offline — using cached data)[/dim]" if RICH else "  (using cached data)")

            # ── Special action commands ───────────────────────────
            write_hud_state(memory, "thinking", "Thinking…")
            action = brain.interpret_command(user_input)

            if action and action != "web_search":
                response = commands.handle(action, user_input)
                if response:
                    cprint(f"\n[bold cyan]SIINDEX:[/bold cyan] {response}" if RICH else f"\nSIINDEX: {response}")
                    write_hud_state(memory, "speaking", response)
                    voice.speak_async(response)
                    write_hud_state(memory, "ready", response)
                    continue

            # ── Claude response (streamed) ────────────────────────
            cprint("\n[bold cyan]SIINDEX:[/bold cyan] " if RICH else "\nSIINDEX: ", end="", flush=True)
            full_response = []
            for chunk in brain.think(user_input, stream=True):
                print(chunk, end="", flush=True)
                full_response.append(chunk)
            print()

            response_text = "".join(full_response)
            write_hud_state(memory, "speaking", response_text)
            if not text_mode:
                voice.speak_async(response_text)
            write_hud_state(memory, "ready", response_text)

        except KeyboardInterrupt:
            cprint("\n\n[dim]SIINDEX paused. Press Ctrl+C again to exit.[/dim]" if RICH else "\nPaused.")
            try:
                time.sleep(2)
            except KeyboardInterrupt:
                break
            continue
        except Exception as e:
            cprint(f"\n[red]Error: {e}[/red]" if RICH else f"\nError: {e}")

    if wake_engine:
        wake_engine.stop()


# ── Entry point ──────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="SIINDEX — Sovereign Intelligence Agent")
    parser.add_argument("--text",     action="store_true", help="Text-only mode")
    parser.add_argument("--briefing", action="store_true", help="Morning briefing then exit")
    parser.add_argument("--no-hud",   action="store_true", help="Don't open HUD")
    parser.add_argument("--no-wake",  action="store_true", help="Disable wake word")
    args = parser.parse_args()

    print_banner()

    # Load config (merges .env + settings.json)
    settings = load_settings()
    if not validate_api_key(settings):
        cprint("[red]✗ No API key. Add ANTHROPIC_API_KEY to .env or config/settings.json[/red]" if RICH else
               "✗ No API key. See .env.example")
        sys.exit(1)

    api_key = settings["anthropic_api_key"]

    # Init all components
    memory   = CitizenMemory(max_history=settings.get("memory", {}).get("max_history", 30))
    brain    = SIINDEXBrain(memory)
    voice    = VoiceEngine(
        voice=settings.get("voice", {}).get("tts_voice", "en-AU-NatashaNeural"),
        rate=settings.get("voice", {}).get("tts_rate", "+0%"),
    )
    commands = CommandHandler(memory)
    supabase = SupabaseSync()
    vision   = VisionEngine(api_key=api_key, model=settings.get("model", "claude-haiku-4-5-20251001"))

    # ── Supabase ping ────────────────────────────────────────────
    cprint("[dim]Connecting to IN$DEX backend…[/dim]" if RICH else "Connecting to Supabase…")
    online = supabase.ping()
    cprint(f"[green]✓ Supabase connected[/green]" if (RICH and online) else
           f"[dim]  Supabase offline — using local cache[/dim]" if RICH else
           f"{'✓ Supabase' if online else 'Offline — local cache'}")

    # ── Sync citizen data on startup ─────────────────────────────
    if online and not memory.is_new_citizen():
        supabase.sync_to_memory(memory)

    # ── Price alerts ─────────────────────────────────────────────
    def on_price_alert(alert, price):
        msg = f"Price alert! INDX has gone {alert.direction} ${alert.target:.2f}. Current price: ${price:.2f}."
        if alert.id == "grand_synchronicity":
            msg = f"Grand Synchronicity! INDX has reached ${price:.2f}! The Sovereign Economy milestone is here!"
        cprint(f"\n[bold gold1]🔔 {msg}[/bold gold1]" if RICH else f"\n🔔 {msg}")
        write_hud_state(memory, "speaking", msg)
        voice.speak(msg)

    alerts = PriceAlertEngine(on_alert=on_price_alert)
    alerts.start()

    # ── Scheduler: auto morning briefing ─────────────────────────
    scheduler = SIINDEXScheduler()
    briefing_time = settings.get("citizen", {}).get("preferences", {}).get("briefing_time", "07:00")

    def auto_briefing():
        cprint("\n[bold yellow]☀ Auto morning briefing[/bold yellow]" if RICH else "\n☀ Auto briefing")
        supabase.sync_to_memory(memory)
        c   = memory.citizen
        msg = commands.morning_briefing()
        cprint(f"[cyan]SIINDEX:[/cyan] {msg}" if RICH else f"SIINDEX: {msg}")
        write_hud_state(memory, "speaking", msg)
        voice.speak(msg)
        write_hud_state(memory, "ready", msg)

    h, m = parse_time(briefing_time)
    scheduler.add_daily(h, m, auto_briefing, "Morning Briefing")

    # Sync every 5 minutes in background
    scheduler.add_interval(300, lambda: supabase.sync_to_memory(memory), "Supabase sync")
    scheduler.start()

    # ── HUD ──────────────────────────────────────────────────────
    if not args.no_hud and settings.get("dashboard", {}).get("enabled", True):
        threading.Thread(
            target=lambda: (time.sleep(1.5), webbrowser.open(HUD_HTML.as_uri())),
            daemon=True
        ).start()

    # ── First-run or returning citizen ───────────────────────────
    if memory.is_new_citizen():
        first_run_setup(memory, brain, voice, args.text)
        print_stats(memory, supabase)
    else:
        print_stats(memory, supabase)

        if args.briefing:
            cprint("\n[bold yellow]☀ Morning Briefing[/bold yellow]\n" if RICH else "\n☀ Morning Briefing\n")
            supabase.sync_to_memory(memory)
            msg = commands.morning_briefing()
            cprint(f"[cyan]SIINDEX:[/cyan] {msg}" if RICH else f"SIINDEX: {msg}")
            voice.speak(msg)
            sys.exit(0)

        name     = memory.citizen.get("name", "")
        greeting = f"Welcome back, {name}. SIINDEX online. All systems active." if name else "SIINDEX online."
        cprint(f"\n[bold cyan]SIINDEX:[/bold cyan] {greeting}" if RICH else f"\nSIINDEX: {greeting}")
        write_hud_state(memory, "ready", greeting)
        if not args.text:
            voice.speak_async(greeting)

    # ── Main loop ────────────────────────────────────────────────
    wake_active = not args.no_wake and not args.text and WakeWordEngine.available()
    conversation_loop(
        brain, memory, voice, commands, vision,
        alerts, supabase, args.text, wake_active
    )

    # ── Shutdown ─────────────────────────────────────────────────
    scheduler.stop()
    alerts.stop()
    name = memory.citizen.get("name", "Citizen")
    cprint(f"\n[dim]SIINDEX signing off. Until next time, {name}.[/dim]\n" if RICH else f"\nSIINDEX signing off.\n")


if __name__ == "__main__":
    main()
