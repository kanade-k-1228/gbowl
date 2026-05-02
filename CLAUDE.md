# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 概要

スマホの加速度・ジャイロセンサで運転中の G を可視化する PWA。React + TypeScript + Vite + Tailwind + jotai。GitHub Pages (`/gbowl/`) にデプロイ。

## コマンド

```bash
pnpm run dev      # vite --host (LAN の実機からも到達可)
pnpm run build    # tsc -b && vite build
pnpm run lint     # biome check .
pnpm run format   # biome check --write .
```

DeviceMotion / AudioContext は実機 (iOS Safari など) でしか動かない。

## 方針

- **CSS**: Tailwind v3 のみ。`*.module.css` は使わない。条件付きクラスは `clsx`。
- **アイコン**: `lucide-react` の名前付き import。絵文字や独自 SVG は使わない。
- **状態**: `src/state/` の jotai atom 経由。hook が atom に書き、view は `useAtomValue` で読む。
- **Lint/Format**: Biome のみ (ESLint/Prettier 撤去済み)。Tailwind ディレクティブと衝突するため CSS は対象外 (`!**/*.css`)。

## アーキテクチャ

センサ → atom → view の単方向。

- `src/hook/`: ブラウザ API を購読して atom に書き込む層 (`useDeviceMotion`, `useGeolocation`, `useSound`)。iOS の DeviceMotion / AudioContext は user gesture 起点で許可を取る。
- `src/state/`: jotai atom。`carState` は `deviceMotionState` × `matrixState` の derived。
- `src/view/`: `useAtomValue` で読むだけのプレゼンテーション層。`Bowl` は SVG、`Plot` は Chart.js、`Table` は数値表示。

## デプロイ

- `vite.config.ts` の `base: "/gbowl/"` と `package.json` の `homepage` は GitHub Pages の配信パスと同期。
- `.github/workflows/deploy.yml` が `main` への push で `actions/deploy-pages@v4` 経由で公開。`ci.yml` は PR で lint + build を回すだけ。
- 初回のみ Settings → Pages → Source を「GitHub Actions」に切り替える必要あり。
- PWA は `vite-plugin-pwa` (autoUpdate)。manifest はビルド時生成。
