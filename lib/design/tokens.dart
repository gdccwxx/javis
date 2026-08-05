import 'package:flutter/material.dart';

/// 设计系统色板。
///
/// 与 `FirstMate_Desktop_Prototype.html` 中的 `:root` CSS 变量一一对应，
/// 命名保持一致，方便和设计稿互相对照。
abstract final class AppColors {
  // 基础表面
  static const bg = Color(0xFFF5F6F8);
  static const shellBg = Color(0xFFF1F3F7);
  static const surface = Color(0xFFFFFFFF);
  static const panel = Color(0xFFFAFBFC);
  static const sidebarBg = Color(0xFFFBFCFD);

  // 描边
  static const line = Color(0xFFE7E9EE);
  static const lineStrong = Color(0xFFD8DCE5);
  static const lineSoft = Color(0xFFEFF1F4);

  // 文字
  static const text = Color(0xFF18212F);
  static const muted = Color(0xFF697386);
  static const soft = Color(0xFF94A0B2);
  static const navText = Color(0xFF526071);
  static const bodyText = Color(0xFF3B4655);

  // 主色
  static const violet = Color(0xFF6750D8);
  static const violet50 = Color(0xFFF0EFFD);
  static const violet100 = Color(0xFFE4E2FB);
  static const violetInk = Color(0xFF4632AB);

  // 语义色
  static const teal = Color(0xFF087D67);
  static const teal50 = Color(0xFFE8F7F2);
  static const amber = Color(0xFFA76500);
  static const amber50 = Color(0xFFFFF6E4);
  static const danger = Color(0xFFBD3D3D);
  static const danger50 = Color(0xFFFFF0EF);
  static const blue = Color(0xFF2876C8);
  static const blue50 = Color(0xFFEFF7FF);
  static const success = Color(0xFF378B55);

  // diff 用色
  static const plus = Color(0xFF278144);
  static const minus = Color(0xFFC44A4A);

  //窗口按钮
  static const trafficRed = Color(0xFFFF5F57);
  static const trafficYellow = Color(0xFFFEBC2E);
  static const trafficGreen = Color(0xFF28C840);

  // 中性填充
  static const chipBg = Color(0xFFF3F5F7);
  static const hoverBg = Color(0xFFF4F5F8);
  static const bubbleBg = Color(0xFFF7F8FA);
  static const bubbleBorder = Color(0xFFEFF0F2);
}

/// 圆角、间距、阴影等尺寸常量。
abstract final class AppRadius {
  static const xs = 4.0;
  static const sm = 6.0;
  static const md = 7.0;
  static const lg = 9.0;
  static const xl = 11.0;
  static const shell = 14.0;
  static const pill = 99.0;
}

abstract final class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
}

abstract final class AppShadows {
  static const shell = <BoxShadow>[
    BoxShadow(
      color: Color(0x17141B28),
      blurRadius: 32,
      offset: Offset(0, 12),
    ),
  ];
}

/// 布局固定尺寸，来自原型 grid 定义。
abstract final class AppLayout {
  /// `grid-template-columns: 236px ...`
  static const sidebarWidth = 236.0;

  /// 窄屏时侧边栏收窄到 210px
  static const sidebarWidthCompact = 210.0;

  /// `grid-template-columns: ... 300px`
  static const inspectorWidth = 300.0;

  /// `.appbar { height: 46px }`
  static const appBarHeight = 46.0;

  /// `.view-header { height: 64px }`
  static const viewHeaderHeight = 64.0;

  /// `.file-tree` 所在列宽
  static const fileTreeWidth = 230.0;

  /// 低于此宽度隐藏右侧检查器（对应 `@media (max-width:1050px)`）
  static const inspectorBreakpoint = 1050.0;

  /// 卡片网格切换为单列的断点
  static const gridBreakpoint = 900.0;

  /// 外层演示壳体的最大宽度
  static const shellMaxWidth = 1520.0;
}

/// 字体族。桌面端沿用系统字体栈，等宽用于代码块。
abstract final class AppFonts {
  static const sans = <String>[
    '.AppleSystemUIFont',
    'PingFang SC',
    'Segoe UI',
    'Microsoft YaHei',
  ];

  static const mono = <String>[
    'SF Mono',
    'Menlo',
    'Consolas',
    'monospace',
  ];
}

/// 文本样式集合。字号、行高、字重都对齐原型 CSS。
abstract final class AppText {
  static const _family = 'PingFang SC';

  static TextStyle get pageTitle => const TextStyle(
        fontSize: 21,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        color: AppColors.text,
      );

  static TextStyle get pageSubtitle => const TextStyle(
        fontSize: 13,
        color: AppColors.muted,
      );

  static TextStyle get viewTitle => const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        color: AppColors.text,
      );

  static TextStyle get viewSubtitle => const TextStyle(
        fontSize: 12,
        color: AppColors.muted,
      );

  static TextStyle get sideLabel => const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.8,
        color: AppColors.soft,
      );

  static TextStyle get navItem => const TextStyle(
        fontSize: 12,
        color: AppColors.navText,
      );

  static TextStyle get navItemActive => const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.violetInk,
      );

  static TextStyle get body => const TextStyle(
        fontSize: 13,
        height: 1.65,
        color: AppColors.text,
      );

  static TextStyle get docBody => const TextStyle(
        fontSize: 13,
        height: 1.75,
        color: AppColors.bodyText,
      );

  static TextStyle get caption => const TextStyle(
        fontSize: 11,
        color: AppColors.muted,
      );

  static TextStyle get micro => const TextStyle(
        fontSize: 10,
        color: AppColors.muted,
      );

  static TextStyle get button => const TextStyle(
        fontSize: 12,
        color: Color(0xFF556172),
      );

  static TextStyle get buttonPrimary => const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      );

  static TextStyle get cardTitle => const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.text,
      );

  static TextStyle get mono => const TextStyle(
        fontFamily: 'SF Mono',
        fontFamilyFallback: AppFonts.mono,
        fontSize: 10,
        height: 1.6,
        color: AppColors.navText,
      );

  static ThemeData buildTheme() {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.shellBg,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.violet,
        surface: AppColors.surface,
        error: AppColors.danger,
      ),
      textTheme: base.textTheme.apply(
        fontFamily: _family,
        fontFamilyFallback: AppFonts.sans,
        bodyColor: AppColors.text,
        displayColor: AppColors.text,
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.line,
        thickness: 1,
        space: 1,
      ),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      visualDensity: VisualDensity.compact,
    );
  }
}
