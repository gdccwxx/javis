import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'design/tokens.dart';
import 'pages/prototype_page.dart';

void main() {
  runApp(const ProviderScope(child: JavisApp()));
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
