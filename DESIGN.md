# Globalne skille git — dokumentacja projektowa

Ten dokument opisuje decyzje projektowe. Nie jest częścią skilli i nie jest czytany przez nie w trakcie działania. Służy do rozbudowy zestawu w przyszłych sesjach. Każdy `SKILL.md` musi działać samodzielnie.

## 1. Zakres

Skille (globalne; docelowe katalogi per harness w sekcji 12, dla Claude Code `~/.claude/skills/<nazwa>/SKILL.md`):

| Skill    | Cel                                                                                   |
|----------|---------------------------------------------------------------------------------------|
| gcommit  | add + commit bieżących zmian (opcjonalnie push, gdy poproszono)                       |
| gpush    | push bieżącej gałęzi, z opcjonalnym wcześniejszym gcommit                              |
| gpull    | pull bieżącej gałęzi                                                                  |
| gch      | przełączenie gałęzi, z propozycjami przy braku dopasowania i obsługą niezapisanych zmian |
| gpr      | gcommit (jeśli trzeba), gpush (jeśli trzeba), utworzenie PR (GitHub) lub MR (GitLab)  |

Obsługiwane hosty: **github.com** i **gitlab.com**. Self-hosted nie jest obsługiwany.

### Zasady ogólne dla wszystkich skilli

- `disable-model-invocation: true`. Skille zmieniające stan repo lub wysyłające dane na zewnątrz uruchamia tylko użytkownik (`/nazwa`).
- `allowed-tools` ograniczone do potrzebnych poleceń (np. `Bash(git *)`, `Bash(gh *)`, `Bash(glab *)`).
- Osobne skille z krótkimi, jasnymi celami. Wspólna logika jest odwoływaniem się do innego skilla (np. gpr wywołuje procedurę gcommit i gpush), a nie kopiowaniem.
- Każdy skill, który wysyła coś widocznego dla innych (commit na współdzielonej gałęzi, push, PR/MR), pokazuje wynik i czeka na potwierdzenie.
- Przy wywołaniu z flagą `--config` skill pokazuje aktualne ustawienia i pozwala je zmienić.
- Przy wywołaniu z flagą `--redetect` skill ponownie wykrywa dane z repo (język, styl) i nadpisuje cache.

## 2. Konfiguracja

### Ustawienia repo (lokalne, `.git/config`, `git config --local`)

| Klucz                      | Wartości            | Znaczenie                                  |
|----------------------------|---------------------|--------------------------------------------|
| `skills.commit.language`   | `en`, `pl`          | język commitów i opisów PR/MR              |
| `skills.commit.style`      | `detected`, `conventional` | styl commitów                       |
| `skills.commit.coauthor`   | `true`, `false`     | dopisywanie stopki Co-Authored-By (lokalne nadpisanie) |
| `pull.rebase`              | `true`, `false`     | sposób pull; natywny klucz Gita, zob. niżej |

Wartości są zapisywane w cache tylko wtedy, gdy wynik detekcji jest pewny. Przy niejednoznacznej historii nic nie zapisujemy i używamy domyślnych.

### Ustawienia globalne (`git config --global`)

| Klucz                      | Znaczenie                                              |
|----------------------------|--------------------------------------------------------|
| `skills.commit.coauthor`   | domyślna wartość dla repo, w których nie ma wartości lokalnej |
| `pull.rebase`              | domyślne zachowanie `git pull` w każdym repo           |

### Kolejność pierwszeństwa

1. Treść albo jawny parametr w wywołaniu (np. `--ff-only`, `--lang pl`).
2. Ustawienie lokalne (`git config --local`).
3. Ustawienie globalne (`git config --global`).
4. Detekcja z repo (historia commitów), tylko dla języka i stylu.
5. Wartość domyślna: angielski, Conventional Commits, `pull --rebase`, brak Co-Authored-By.

Przykładowo `pull.rebase`: flaga w wywołaniu, potem lokalny klucz, potem globalny, a na końcu `--rebase`.

### Pytanie o Co-Authored-By

Przy pierwszym użyciu jakiegokolwiek skilla w repo bez wartości lokalnej skill pyta, czy dopisywać stopkę. Podpowiada wartość globalną, jeśli istnieje. Odpowiedź zapisuje lokalnie. Jeśli nie ma wartości globalnej, pierwsza odpowiedź zapisuje się też globalnie jako domyślna.

Stopka zawiera nazwę modelu i link do sesji z bieżącego kontekstu, a nie z zapisanej wartości.

### Flagi wspólne

- `--redetect` — ponowna detekcja języka i stylu z historii repo, nadpisuje cache.
- `--config` — pokazuje ustawienia (lokalne i globalne) i pozwala je zmienić.

## 3. Język i styl commitów

### Język (kolejność)

1. Treść podana wprost w wiadomości — użyta dokładnie tak, bez tłumaczenia.
2. Język podany w wywołaniu (np. „po polsku").
3. Cache `skills.commit.language`.
4. Detekcja z ostatnich ~20 commitów (`git log -20 --format=%s`). Jeśli wyraźna większość jest po polsku, wybór to `pl`, w pozostałych przypadkach `en`.
5. Domyślnie `en`.

### Styl (kolejność)

1. Wartość podana w wywołaniu.
2. Cache `skills.commit.style`.
3. Detekcja: jeśli większość ostatnich commitów ma prefiks `typ:` albo `typ(zakres):` zgodny z Conventional Commits, styl to `conventional`. Jeśli repo ma inną wyraźną konwencję, skill ją naśladuje. W przeciwnym razie `detected` oznacza krótkie zdanie w trybie rozkazującym.
4. Domyślnie Conventional Commits.

## 4. gcommit

- Zamiast `git add .` najpierw `git status --short` i pokazanie listy plików.
- Dodanie: po potwierdzeniu `git add -A` albo wybrane pliki. Już staged zmiany są respektowane.
- Ostrzeżenie przy plikach wrażliwych (`.env`, `*.pem`, klucze, dane logowania) i dużych binarkach lub artefaktach build.
- Wiadomość wg kolejności z sekcji 3. Pokazanie przed commitem.
- Stopka Co-Authored-By wg sekcji 2.

## 5. gpush

- Najpierw `git fetch`, potem sprawdzenie, czy gałąź nie jest za zdalną (behind). Jeśli tak, zatrzymanie i pokazanie stanu. Nie robimy automatycznie merge ani rebase.
- Brak upstreamu: `git push -u origin <gałąź>`.
- Force nigdy bez wyraźnego polecenia. Jeśli konieczny, to `--force-with-lease` po potwierdzeniu.
- Opcjonalnie blokada bezpośredniego pusha na `main` lub `master`.
- Na prośbę użytkownika wywołanie procedury gcommit przed pushem.

## 6. gpull

- Domyślnie `git pull --rebase --autostash` (lub zachowanie z `pull.rebase`, jeśli ustawione lokalnie lub globalnie).
- Nadpisanie przy wywołaniu: `--ff-only` lub `--rebase`.
- Konflikt: zatrzymanie i pokazanie stanu. Skill nie rozwiązuje konfliktów sam, może zaproponować `git rebase --abort`.
- Detached HEAD: zatrzymanie z komunikatem.
- Po pullu pokazanie nowych commitów: `git log --oneline ORIG_HEAD..HEAD`.

## 7. gch

- Przełączenie przez `git switch`, nie `git checkout`. Nowa gałąź: `git switch -c <nazwa>`. Powrót: `git switch -`.
- Wyszukiwanie: najpierw dokładne dopasowanie, potem `git branch -a --list "*fraza*"`, potem lista propozycji. Gałąź tylko zdalna jest przełączana jako tracking.
- Niezapisane zmiany: najpierw próba `git switch`, bo Git przenosi zmiany, jeśli nie kolidują. Przy konflikcie proponujemy: stash (`git stash push -u -m "..."`), commit WIP albo anulowanie. Odrzucenie zmian tylko po wyraźnym potwierdzeniu.
- Nowa gałąź: `git fetch`, potem `git switch -c <nazwa> origin/<domyślna>`, nie z przypadkowego HEAD.

## 8. gpr

### Wykrywanie hosta i narzędzia

1. `git remote get-url origin` i ustalenie hosta.
2. `github.com` → GitHub (PR). `gitlab.com` → GitLab (MR). Inne hosty nie są obsługiwane, skill to zgłasza.
3. Gałąź docelowa z `git symbolic-ref refs/remotes/origin/HEAD`, bez zakładania `main`.

### Łańcuch fallbacków

1. **CLI.** `gh` dla GitHub, `glab` dla GitLab. Używane, gdy jest zainstalowane i zalogowane (`gh auth status`, `glab auth status`).
2. **REST API z tokenem** z zmiennej środowiskowej (`GITHUB_TOKEN`, `GITLAB_TOKEN`). Token nigdy nie trafia do repo ani do skilla. Endpointy: GitHub `POST /repos/{owner}/{repo}/pulls`, GitLab `POST /projects/:id/merge_requests`.
3. **Link z prefillem** w przeglądarce. GitHub: `https://github.com/{owner}/{repo}/compare/{base}...{branch}?expand=1&title=...&body=...`. GitLab: `https://gitlab.com/{ścieżka}/-/merge_requests/new?merge_request[source_branch]={branch}`.

Każdy krok łańcucha, który się nie udaje, przekazuje do następnego i informuje użytkownika, którą ścieżkę wybrano.

### Przebieg

1. Stan repo. Jeśli są niezapisane zmiany, procedura gcommit.
2. Jeśli gałąź nie ma upstreamu lub ma nieopublikowane commity, procedura gpush.
3. Sprawdzenie, czy PR/MR już istnieje. Jeśli tak, zwrócenie linku.
4. Wygenerowanie tytułu i opisu z commitów i diffu, pokazanie ich i czekanie na potwierdzenie.
5. Utworzenie PR/MR z jawnymi parametrami (bez interaktywnych pytań).
6. Zwrócenie linku.

## 9. Dziennik decyzji

- **2026-11-10** — Język: treść podana wprost, potem wywołanie, potem detekcja z repo, potem angielski.
- **2026-11-10** — Styl: detekcja z repo, potem Conventional Commits.
- **2026-11-10** — Cache w `.git/config` (`git config --local`). Zapis tylko przy pewnym wyniku. `--redetect` wymusza odświeżenie.
- **2026-11-10** — Co-Authored-By: pytanie przy pierwszym użyciu w repo, wartość lokalna nadpisuje globalną, `--config` zmienia obie.
- **2026-11-10** — `--config` zmienia ustawienia, `--redetect` odświeża tylko dane z repo.
- **2026-11-10** — gpull: `pull --rebase --autostash` jako domyślne, nadpisywane flagą. Ustawienie przez natywny klucz `pull.rebase`.
- **2026-11-10** — gpr: łańcuch CLI, REST z tokenem, link z prefillem.
- **2026-11-10** — Obsługiwane hosty: github.com i gitlab.com. Self-hosted odrzucony.
- **2026-11-10** — Osobne skille zamiast jednego `/git`.
- **2026-11-10** — gch: bez osobnej blokady przy niezapisanych zmianach. Najpierw `git switch`, przy konflikcie pytanie (stash, commit WIP, anulowanie).
- **2026-11-10** — Obecność `gh`/`glab` jest sprawą użytkownika. Skill wykrywa i przechodzi w fallback (REST, potem link), brak CLI nie jest błędem.
- **2026-11-10** — Tokeny (`GITHUB_TOKEN`, `GITLAB_TOKEN`) opcjonalne, używane tylko gdy ustawione. Skill ich nie ustawia, nie zapisuje ani nie wyświetla. Minimalne uprawnienia: GitHub `pull_requests: write` (fine-grained), GitLab scope `api`.
- **2026-11-10** — Wymagania konfiguracyjne i pełny opis możliwości trafią do README.md dla użytkownika, tworzonego gdy zestaw skilli zostanie uznany za gotowy. Do tego czasu źródłem jest ten dokument.

- **2026-11-10** — Dystrybucja: npm lub git, jeden instalator (`bin/install.mjs`, zero zależności). Cel: katalogi globalne Claude Code, Cursor, Codex, OpenCode (sekcja 12). Jedno źródło skilli w `skills/`.
- **2026-11-10** — Instalacja jawna (komenda), bez zapisu poza pakietem w `postinstall` — skille zmieniają stan repo/wysyłają dane, użytkownik ma świadomie je dodać. Własność katalogów przez `.git-skills.json`, cudze skille nie są nadpisywane bez `--force`.
- **2026-11-10** — Codex: `~/.agents/skills/` jako ścieżka docelowa (oficjalna dokumentacja), `~/.codex/skills/` tylko dla starszych wersji. Cursor czyta katalogi innych harness, więc unikamy duplikatów.

## 10. Otwarte punkty

- Weryfikacja ścieżek globalnych harness (sekcja 12) na zainstalowanych wersjach przed pierwszym wydaniem. Źródła: oficjalne dokumentacje Cursor i Codex, dla OpenCode źródła trzecie.
- Zachowanie pól frontmatter specyficznych dla Claude Code (`disable-model-invocation`, `allowed-tools`) w pozostałych harness. Zakładamy, że nieznane pola są ignorowane (niezweryfikowane). Jeśli któryś harness je odrzuca, instalator generuje uproszczony frontmatter.

## 12. Dystrybucja i instalacja

### Cel

Skille instalowane na maszynie użytkownika w katalogach globalnych obsługiwanych harness: **Claude Code, Cursor Agent, Codex, OpenCode**. Źródła instalacji: **npm** (pakiet publikowany w rejestrze) albo **git** (klon lub `npx github:<owner>/<repo>`). Oba używają tego samego instalatora.

### Katalogi docelowe (skill = katalog `<nazwa>/SKILL.md`)

| Harness     | Katalog globalny                                   | Nadpisanie środowiskowe |
|-------------|----------------------------------------------------|-------------------------|
| Claude Code | `~/.claude/skills/`                                | `CLAUDE_CONFIG_DIR`     |
| Cursor      | `~/.cursor/skills/`                                | brak                    |
| Codex       | `~/.agents/skills/` (starsze wersje: `~/.codex/skills/`) | `CODEX_HOME` dla starszej ścieżki |
| OpenCode    | `~/.config/opencode/skills/`                       | `XDG_CONFIG_HOME`       |

Uwaga: Cursor czyta także `~/.claude/skills/`, `~/.codex/skills/` i `~/.agents/skills/`. Instalacja do wielu katalogów może dać zdublowane skille w Cursorze. Instalator ostrzega o tym i domyślnie nie instaluje do `~/.cursor/skills/`, jeśli skill jest już widoczny przez inny wybrany katalog (zob. dziennik).

### Układ repo/pakietu

```
package.json            # name, version, bin, files, engines (node >= 18)
bin/install.mjs         # instalator (zero zależności, tylko moduły wbudowane Node)
skills/<nazwa>/SKILL.md # jedyne źródło prawdy dla skilli
DESIGN.md, README.md
```

`package.json`: `"bin": {"git-skills": "bin/install.mjs"}`, `"files": ["bin", "skills", "README.md"]`, `"scripts": {"postinstall": ...}` — **bez** automatycznego postinstall zapisującego poza pakietem (zob. dziennik). Instalacja jest jawna.

### Instalator (`git-skills`)

Wywołania:

- `npx git-skills install` (npm), `npx github:<owner>/<repo> install` (git bez publikacji), `node bin/install.mjs install` (lokalny klon).
- Opcje: `--harness claude,cursor,codex,opencode` (domyślnie: wykryte), `--skills gcommit,gpr` (domyślnie wszystkie), `--mode copy|symlink` (domyślnie `copy`; `symlink` dla klonu git, aktualizacja przez `git pull`), `--dry-run`, `--force`.
- Podkomendy: `install`, `update`, `uninstall`, `list` (co i gdzie zainstalowane, wersja).

Zasady:

- Wykrycie harness: istnieje katalog konfiguracyjny harness (`~/.claude`, `~/.cursor`, `~/.codex` lub `~/.agents`, `~/.config/opencode`). Brak wykrycia nie jest błędem, użytkownik wskazuje `--harness`.
- Znacznik własności: w każdym zainstalowanym katalogu plik `.git-skills.json` (`{package, version, installedAt}`). Instalator nadpisuje i usuwa tylko katalogi z własnym znacznikiem. Katalog bez znacznika (skill użytkownika o tej samej nazwie) wymaga `--force`, a wcześniej jest przenoszony do kopii `*.bak`.
- Idempotencja: ponowna instalacja tej samej wersji nic nie zmienia.
- `--dry-run` wypisuje plan (źródło → cel) i nic nie zapisuje.
- Brak sieci i brak zależności w czasie instalacji. Instalator niczego nie pobiera poza samym pakietem/klonem.
- Skille nie są modyfikowane per harness, chyba że otwarty punkt z frontmatterem tego wymaga.

### Wersjonowanie i wydania

- SemVer w `package.json`. Tag git `vX.Y.Z` = wydanie. Wersja w `.git-skills.json` pozwala `update`/`list` wykryć rozjazd.
- Instalacja z gita bez tagu = HEAD domyślnej gałęzi (kanał „edge").

## 11. Rozszerzanie

- **Nowy host:** dopisać wpis w sekcji 8 (wykrywanie) i w sekcji łańcucha fallbacków, z zaktualizowaniem dziennika decyzji.
- **Nowy klucz konfiguracyjny:** dopisać do sekcji 2, z zasadą pierwszeństwa i wartością domyślną, oraz do dziennika.
- **Nowy skill:** opisać w sekcji 1 i dodać wspólne zasady z sekcji 1 oraz konfigurację z sekcji 2.
- **README.md:** po uznaniu zestawu za gotowy utworzyć README dla użytkownika (możliwości skilli, wymagania: `gh`/`glab`, tokeny i uprawnienia, klucze konfiguracji, flagi).
- **Zmiana zasady:** nie edytować po cichu. Dopisać nowy wpis w dzienniku z datą i uzasadnieniem.
