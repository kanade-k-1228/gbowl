# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

G-Bowl (G-Moni) は、スマートフォンの加速度センサ・ジャイロセンサを利用して運転中の G を可視化する PWA アプリ。React + TypeScript + Vite で構築され、GitHub Pages (`/gbowl/` 配下) にデプロイされる。

## よく使うコマンド

```bash
pnpm run dev      # vite を --host 付きで起動 (LAN 内のスマホから実機テスト可)
pnpm run build    # tsc -b でプロジェクト参照ビルド → vite build
pnpm run lint     # biome check . (lint + format + organizeImports をチェックのみ)
pnpm run format   # biome check --write . (Safe Fix を自動適用)
pnpm run preview  # ビルド成果物をローカルプレビュー
pnpm run deploy   # gh-pages で dist/ を gh-pages ブランチへデプロイ
```

DeviceMotion / AudioContext は実機 (iOS Safari など) でしか動かないので、UI ロジック以外の検証はスマホで行う。

## Lint / Format: Biome

Lint・フォーマット・import 整理はすべて [Biome](https://biomejs.dev/) (`@biomejs/biome`) に統一済み。ESLint / Prettier は撤去されている。

- 設定は `biome.json`。インデントは 2 スペース、ダブルクォート、ES5 trailing comma。
- `pnpm run lint` で CI 相当のチェック、`pnpm run format` で Safe Fix の自動適用。
- CSS ファイル (`src/index.css`) は Tailwind ディレクティブを含むため `biome.json` の `files.includes` で `!**/*.css` として明示的に除外している。CSS を Biome に流したい場合は Tailwind との互換オプションを別途検討すること。
- `noExplicitAny` は warn に下げてある。新規コードでは極力避け、必要な箇所では型ガードを書く。

## スタイリング方針: Tailwind CSS

スタイルは Tailwind CSS v3 のユーティリティクラスで書く。`*.module.css` は新規追加禁止。

- クラス名は JSX の `className` 内に直接書き、長くなる場合のみ `clsx` などで整理する。
- グローバルスタイルは `src/index.css` の `@tailwind base; @tailwind components; @tailwind utilities;` 配下に `@layer base { ... }` で追記する。
- Tailwind の content scan 対象は `tailwind.config.js` の `content: ["./index.html", "./src/**/*.{ts,tsx}"]`。新しい場所にコンポーネントを置く場合はここを更新する。
- PostCSS パイプラインは `postcss.config.js` (tailwindcss + autoprefixer) で、Vite が自動で読む。

## アイコン方針: lucide

アイコンは `lucide-react` の SVG コンポーネントを使う。絵文字 (例: ⚖, 🎵) や独自 SVG パスを新規に追加しない。

- import は名前付きで `import { Play, Pause, Save } from "lucide-react";` のように個別に取る (Tree-shaking 効かせるため)。
- サイズ・色は Tailwind のユーティリティ (`className="w-5 h-5 text-gray-700"`) で統一する。

## 状態管理方針: jotai

センサ値・キャリブレーション行列・派生値はすべて `src/state/state.ts` の jotai atom 経由で受け渡す。コンポーネントから `useDeviceMotion` の戻り値を直接 props バケツリレーしない。

- 生センサ値は `deviceMotionState` (atom) に書き込む。`useDeviceMotion` 側で `useSetAtom(deviceMotionState)` を呼んで更新するのが想定形。
- キャリブレーション行列は `matrixState`、車体座標系の加速度は derived な `carState` で取得する。
- 新しい派生値が必要になったら hook ではなく derived atom として `state.ts` に追加する。

## アーキテクチャ

データフローは「センサ → atom → view」の単方向。`useDeviceMotion` がブラウザの DeviceMotion イベントを atom に書き込み、view 側は `useAtomValue` で読むだけ。時系列バッファは `useMotionRecorder` が atom 同士を中継する。

- **`src/hook/useDeviceMotion.ts`**: `DeviceMotionEvent` をリッスンして `deviceMotionState` に書き込む。iOS Safari では `DeviceMotionEvent.requestPermission()` が必要なので、ユーザー操作起点で `requestPermission` を呼ぶ。戻り値は `{ permissionGranted, requestPermission }` のみ。
- **`src/hook/useMotionRecorder.ts`**: `deviceMotionState` を購読し、直近 N サンプル (デフォルト `SERIES_WINDOW=50`) を `accSeriesState` / `gyroSeriesState` に push する。`App` で 1 回だけ呼ぶ。
- **`src/hook/useSound.ts`**: WebAudio の `OscillatorNode` をラップ。`freq`/`volume` は `linearRampToValueAtTime` でスムージング。`start()` も AudioContext 生成を含むためユーザー操作起点で呼ぶ必要がある。
- **`src/state/state.ts`**: `deviceMotionState` (生値)、`matrixState` (3x3 キャリブ行列)、`carState` (`deviceMotionState` × `matrixState` の derived)、`accSeriesState` / `gyroSeriesState` (時系列バッファ)。GPS フュージョン用に `geolocationState` / `fusedState` も予約済み。
- **`src/view/App.tsx`**: ルートコンポーネント。Header (Play/Pause、lucide-react)、`Table` (生値表示)、`Plot`、`Bowl`、Footer (Calib/Save、未実装) を grid で縦積み。
- **`src/view/Bowl/Bowl.tsx`**: SVG の同心円上に `acceleration.(x,y) × 100` の位置を打つ。`useAtomValue(deviceMotionState)` で直接読む。
- **`src/view/Plot/Plot.tsx`**: `react-chartjs-2` で Ax/Ay/Az + Yaw/Pitch/Roll の 6 系列を折れ線描画。Y 軸は ±2.0 固定。データは `accSeriesState` / `gyroSeriesState` から取得。
- **`src/view/Table/Table.tsx`**: 生値・絶対値の数値表示。`grid-cols-[repeat(5,32px)]` の右寄せレイアウト。

## PWA / デプロイ

- `vite-plugin-pwa` の `registerType: "autoUpdate"` でサービスワーカーを自動更新。`includeAssets` に `favicon.ico` と `apple-touch-icon.png` を含む。
- `vite.config.ts` の `base: "/gbowl/"` は GitHub Pages 配信パスに合わせてある。ローカルパスを書き換える場合は `package.json` の `homepage` も併せて変更。
- `index.html` は `/manifest.json` を参照しているが、リポジトリ内には `manifest.json` を直接置かず `vite-plugin-pwa` 側で生成する設定を期待している。

### GitHub Actions による自動デプロイ

- `.github/workflows/deploy.yml`: `main` への push (および手動 `workflow_dispatch`) で起動。pnpm install → `pnpm run lint` → `pnpm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages@v4` の流れ。
- `.github/workflows/ci.yml`: PR 時に lint と build だけを回す軽量 CI。
- 初回セットアップ時は **GitHub リポジトリの Settings → Pages → Build and deployment → Source を「GitHub Actions」に変更** する必要がある。`gh-pages` ブランチへの push ではなく、Pages の専用 artifact をデプロイする方式。
- ローカル手動デプロイ (`pnpm run deploy`, `gh-pages` パッケージ経由) は緊急用に残しているが、通常は Actions に任せる。

## TypeScript 設定

- `strict: true` に加えて `noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` / `noUncheckedSideEffectImports` を有効化。未使用変数は CI で落ちる。
- `tsconfig.json` はプロジェクト参照のみで、実体は `tsconfig.app.json` (アプリ) と `tsconfig.node.json` (vite 設定) に分割。
