import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/workbench_shell.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';

/// 原型演示页。
///
/// 对应原型 HTML 最外层的 `.prototype` + `.topbar`：
/// 灰色背景上浮一个带圆角和阴影的应用窗口，右上角可切换 macOS / Windows 外观。
///
/// 真正打包成桌面应用时直接用 [WorkbenchShell] 铺满窗口即可，
/// 这一层只服务于设计走查和评审。
class PrototypePage extends ConsumerWidget {
  const PrototypePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final platform = ref.watch(platformStyleProvider);
    final isWindows = platform == DesktopPlatformStyle.windows;

    return ColoredBox(
      color: AppColors.shellBg,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: AppLayout.shellMaxWidth,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const _TopBar(),
                  const SizedBox(height: 18),
                  Expanded(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        border: Border.all(color: AppColors.lineStrong),
                        // Windows 用小圆角，macOS 用大圆角。
                        borderRadius: BorderRadius.circular(
                          isWindows ? 5 : AppRadius.shell,
                        ),
                        boxShadow: AppShadows.shell,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(
                          isWindows ? 5 : AppRadius.shell,
                        ),
                        child: const WorkbenchShell(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TopBar extends ConsumerWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('FirstMate Desktop', style: AppText.pageTitle),
              const SizedBox(height: 5),
              Text(
                '文件优先的 Agent 工作台 · macOS 和 Windows 完整桌面版',
                style: AppText.pageSubtitle,
              ),
            ],
          ),
        ),
        const _PlatformSegmented(),
        const SizedBox(width: 8),
        GhostButton(
          label: '回到对话',
          onPressed: () => ref.read(activeViewProvider.notifier).state =
              WorkbenchView.chat,
        ),
      ],
    );
  }
}

/// macOS / Windows 分段控件。对应 `.segmented`。
class _PlatformSegmented extends ConsumerWidget {
  const _PlatformSegmented();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(platformStyleProvider);

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.lineStrong),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Row(
        children: [
          for (final style in DesktopPlatformStyle.values)
            _SegmentButton(
              label: style == DesktopPlatformStyle.macOS ? 'macOS' : 'Windows',
              active: style == current,
              onTap: () =>
                  ref.read(platformStyleProvider.notifier).state = style,
            ),
        ],
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  const _SegmentButton({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: active ? AppColors.violet50 : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: active ? FontWeight.w600 : FontWeight.w400,
              color: active ? AppColors.violetInk : AppColors.muted,
            ),
          ),
        ),
      ),
    );
  }
}
