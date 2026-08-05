import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'design/tokens.dart';
import 'models/workspace_models.dart';
import 'pages/prototype_page.dart';
import 'state/workbench_providers.dart';

void main() {
  runApp(
    ProviderScope(
      overrides: [
        // 支持用 `?view=knowledge&platform=windows` 直接打开指定状态。
        // 方便设计走查和评审时把链接指到具体页面，也便于自动截图。
        if (_initialView() case final view?)
          activeViewProvider.overrideWith((ref) => view),
        if (_initialPlatform() case final platform?)
          platformStyleProvider.overrideWith((ref) => platform),
      ],
      child: const JavisApp(),
    ),
  );
}

/// 从启动 URL 里读初始视图。桌面端没有 query string时返回 null。
WorkbenchView? _initialView() {
  final name = Uri.base.queryParameters['view'];
  if (name == null) return null;
  for (final view in WorkbenchView.values) {
    if (view.name == name) return view;
  }
  return null;
}

/// 从启动 URL 里读窗口外观。取值 `macos` / `windows`。
DesktopPlatformStyle? _initialPlatform() {
  return switch (Uri.base.queryParameters['platform']) {
    'windows' => DesktopPlatformStyle.windows,
    'macos' => DesktopPlatformStyle.macOS,
    _ => null,
  };
}

/// FirstMate 桌面工作台。
///
/// 当前入口挂的是 [PrototypePage]（带外层演示壳的设计走查页）。
/// 正式打包桌面应用时把 home 换成 `WorkbenchShell()`让它铺满窗口即可。
class JavisApp extends StatelessWidget {
  const JavisApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FirstMate',
      debugShowCheckedModeBanner: false,
      theme: AppText.buildTheme(),
      home: const PrototypePage(),
      // 桌面端不需要跟随系统字体缩放放大到破版，这里做个上限。
      builder: (context, child) {
        final scale = MediaQuery.textScalerOf(context).clamp(
          minScaleFactor: 1.0,
          maxScaleFactor: 1.15,
        );
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaler: scale),
          child: child!,
        );
      },
    );
  }
}
