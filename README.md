# git-skills

Zestaw globalnych skilli git dla AI agentów: **Claude Code**, **Cursor**, **Codex** i **OpenCode**. Skille zmieniające stan repo lub wysyłające dane uruchamiasz ręcznie, komendą `/nazwa`.

| Skill    | Co robi                                                                              |
|----------|--------------------------------------------------------------------------------------|
| `gcommit` | `add` + `commit` bieżących zmian z wygenerowaną wiadomością (opcjonalnie push)      |
| `gpush`   | Bezpieczny push bieżącej gałęzi (fetch przed pushem, bez force bez potwierdzenia)   |
| `gpull`   | Pull bieżącej gałęzi (domyślnie rebase + autostash) i lista nowych commitów         |
| `gch`     | Przełączanie gałęzi po nazwie lub fragmencie, nowe gałęzie od domyślnej, obsługa niezapisanych zmian |
| `gpr`     | Commit i push w razie potrzeby, potem PR (GitHub) lub MR (GitLab) z wygenerowanym opisem |

Obsługiwane hosty: **github.com** i **gitlab.com**. Self-hosted nie jest obsługiwany.

## Instalacja

Wymagania: Node.js `>= 18`, git. Instalator nie ma zależności.

```bash
npx git-skills install
```

Z repo git, bez publikacji w npm:

```bash
npx github:<owner>/<repo> install
```

Z lokalnego klona (aktualizacja przez `git pull`):

```bash
node bin/install.mjs install --mode symlink
```

### Opcje instalatora

| Opcja                   | Znaczenie                                                                 |
|-------------------------|---------------------------------------------------------------------------|
| `--harness a,b`         | `claude`, `cursor`, `codex`, `opencode` (domyślnie: wykryte w systemie)   |
| `--skills a,b`          | Wybrane skille (domyślnie wszystkie)                                      |
| `--mode copy\|symlink`  | `copy` (domyślnie) kopiuje; `symlink` linkuje do klonu                    |
| `--dry-run`             | Wypisuje plan (źródło → cel), nic nie zapisuje                            |
| `--force`               | Nadpisuje katalogi niezarządzane przez git-skills (kopia do `*.bak`)      |

Podkomendy: `install`, `update`, `uninstall`, `list` (co i gdzie jest zainstalowane, wersja).

### Katalogi docelowe

| Harness     | Katalog                                                | Nadpisanie środowiskowe     |
|-------------|--------------------------------------------------------|-----------------------------|
| Claude Code | `~/.claude/skills/`                                    | `CLAUDE_CONFIG_DIR`         |
| Cursor      | `~/.cursor/skills/`                                    | brak                        |
| Codex       | `~/.agents/skills/` (starsze: `~/.codex/skills/`)      | `CODEX_HOME` (starsza ścieżka) |
| OpenCode    | `~/.config/opencode/skills/`                           | `XDG_CONFIG_HOME`           |

Cursor czyta też katalogi Claude Code, Codexa i `~/.agents/skills/`. Gdy któryś z nich jest wybrany, instalator pomija `~/.cursor/skills/`, żeby nie dublować skilli. Wymuszenie: `--harness cursor,...` (wtedy pojawi się ostrzeżenie).

Instalator zostawia w każdym katalogu plik `.git-skills.json`. Dzięki niemu wie, które skille są jego, i nie rusza cudzych.

## Użycie

W Claude Code, Cursor lub OpenCode wpisz komendę skilla:

```
/gcommit
/gcommit --push
/gpush --commit
/gpull --ff-only
/gch feature/login
/gch -n nazwa-nowej-gałęzi
/gpr --base develop --draft
```

Wszystkie skille pokazują wynik i czekają na potwierdzenie przed zmianami widocznymi dla innych (commit na `main`/`master`, push, utworzenie PR/MR).

### Flagi skilli

| Skill     | Flagi                                                                                 |
|-----------|---------------------------------------------------------------------------------------|
| `gcommit` | `[wiadomość]`, `--lang en\|pl`, `--style conventional\|detected`, `--push`, `--redetect`, `--config` |
| `gpush`   | `--commit`, `--force-with-lease` (tylko po potwierdzeniu), `--config`                 |
| `gpull`   | `--ff-only`, `--rebase`, `--config`                                                   |
| `gch`     | `<gałąź \| fragment \| ->`, `-n` / `--new`, `--config`                                |
| `gpr`     | `--base <gałąź>`, `--draft`, `--lang en\|pl`, `--redetect`, `--config`                |

Wspólne flagi: `--redetect` ponownie wykrywa język i styl commitów z historii repo i nadpisuje cache. `--config` pokazuje ustawienia (lokalne i globalne) i pozwala je zmienić.

Skille **nigdy** nie robią `--force` ani `--no-verify`, nie robią `--amend` bez prośby, nie rozwiązują konfliktów samodzielnie i nie odrzucają zmian bez wyraźnego potwierdzenia.

## Konfiguracja

### Ustawienia repo (`git config --local`)

| Klucz                    | Wartości                    | Znaczenie                                              |
|--------------------------|-----------------------------|--------------------------------------------------------|
| `skills.commit.language` | `en`, `pl`                  | Język commitów i opisów PR/MR                          |
| `skills.commit.style`    | `detected`, `conventional`  | Styl commitów                                          |
| `skills.commit.coauthor` | `true`, `false`             | Stopka `Co-Authored-By` (nadpisanie lokalne)           |
| `pull.rebase`            | `true`, `false`             | Sposób pulla (natywny klucz Gita)                      |

### Ustawienia globalne (`git config --global`)

| Klucz                    | Znaczenie                                                       |
|--------------------------|-----------------------------------------------------------------|
| `skills.commit.coauthor` | Domyślna wartość dla repo bez wartości lokalnej                 |
| `pull.rebase`            | Domyślne zachowanie `git pull` we wszystkich repo               |

### Kolejność pierwszeństwa

1. Treść albo parametr w wywołaniu (np. `--ff-only`, `--lang pl`).
2. `git config --local`.
3. `git config --global`.
4. Detekcja z historii repo (tylko język i styl).
5. Domyślnie: angielski, Conventional Commits, `pull --rebase`, bez `Co-Authored-By`.

Wartości trafiają do cache tylko wtedy, gdy detekcja jest pewna. Przy niejednoznacznej historii nic nie zapisujemy.

### Co-Authored-By

Przy pierwszym użyciu skilla w repo bez wartości lokalnej skill pyta, czy dodawać stopkę. Odpowiedź zapisuje lokalnie. Jeśli nie ma wartości globalnej, zapisuje ją też globalnie. Stopka pochodzi z bieżącej sesji (nazwa modelu i link), nigdy z zapisanej wartości.

## Wymagania i uwierzytelnianie (gpr)

`gpr` tworzy PR/MR łańcuchem fallbacków i informuje, która ścieżka została użyta:

1. **CLI** (preferowane): `gh` dla GitHub, `glab` dla GitLab. Wymagana instalacja i logowanie (`gh auth status`, `glab auth status`).
2. **REST API** z tokenem z env: `GITHUB_TOKEN` lub `GITLAB_TOKEN`. Używane tylko, gdy zmienna jest ustawiona.
3. **Link z prefillem** w przeglądarce. Nie wymaga niczego poza dostępem do repo w przeglądarce.

Brak `gh`/`glab` nie jest błędem. Skill przechodzi do kolejnego kroku.

### Tokeny i minimalne uprawnienia

Tokeny są opcjonalne. Skille ich nie ustawiają, nie zapisują i nie wyświetlają. Przekazywane są do curl przez nagłówek z env.

| Platforma | Zmienna         | Minimalne uprawnienie                              |
|-----------|-----------------|----------------------------------------------------|
| GitHub    | `GITHUB_TOKEN`  | fine-grained token z `pull_requests: write`        |
| GitLab    | `GITLAB_TOKEN`  | scope `api`                                        |

Nie wklejaj tokenów do repo, `.env` ani do historii shella.

## Bezpieczeństwo

- Wszystkie skille mają `disable-model-invocation: true`. Uruchamia je tylko użytkownik.
- `allowed-tools` ograniczone do `git`, `gh`, `glab` i `curl`.
- Ostrzeżenie przed dodaniem plików wrażliwych (`.env`, `*.pem`, klucze, dane logowania) i dużych binariów lub artefaktów build.
- `gpush` zatrzymuje się, gdy gałąź jest za zdalną. Nie robi merge ani rebase automatycznie. Najpierw `/gpull`.
- Push na `main`/`master` wymaga potwierdzenia.

## Rozwój

Źródłem prawdy dla skilli jest katalog `skills/<nazwa>/SKILL.md`. Decyzje projektowe opisuje [DESIGN.md](DESIGN.md).

Struktura:

```
package.json            # name, version, bin, files, engines
bin/install.mjs         # instalator, zero zależności
skills/<nazwa>/SKILL.md # skille
DESIGN.md               # dokumentacja projektowa i dziennik decyzji
README.md               # ten plik
```

## Licencja

MIT
