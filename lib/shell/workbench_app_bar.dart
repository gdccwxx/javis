import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';
import '../widgets/nav_icon.dart';

/// 应用顶栏。对应原型 `.appbar`，高46px，横跨三栏。
class WorkbenchAppBar extends ConsumerWidget {
  const WorkbenchAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final platform = ref.watch(platformStyleProvider);
    final isWindows = platform == DesktopPlatformStyle.windows;

    return Container(
      height: AppLayout.appBarHeight,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          //窗口装饰区固定 76px 宽，保证切换平台时右侧内容不跳动。
          SizedBox(
            width: 76,
            child: isWindows ? const _WindowsBrand() : const _TrafficLights(),
          ),
          const SizedBox(width: 12),
          const _WorkspaceChip(DemoData.workspaceName),
          const Spacer(),
          const _SyncIndicator(),
        ],
      ),
    );
  }
}

class _TrafficLights extends StatelessWidget {
  const _TrafficLights();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Dot(color: AppColors.trafficRed, size: 12),
        SizedBox(width: 7),
        Dot(color: AppColors.trafficYellow, size: 12),
        SizedBox(width: 7),
        Dot(color: AppColors.trafficGreen, size: 12),
      ],
    );
  }
}

class _WindowsBrand extends StatelessWidget {
  const _WindowsBrand();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        WindowsGlyph(),
        SizedBox(width: 7),
        Text(
          'FirstMate',
          style: TextStyle(fontSize: 13, color: AppColors.soft),
        ),
      ],
    );
  }
}

class _WorkspaceChip extends StatelessWidget {
  const _WorkspaceChip(this.name);

  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.panel,
        border: Border.all(color: const Color(0xFFF0F1F4)),
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        name,
        style: const TextStyle(fontSize: 12, color: AppColors.muted),
      ),
    );
  }
}

class _SyncIndicator extends StatelessWidget {
  const _SyncIndicator();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Dot(color: AppColors.success),
        SizedBox(width: 6),
        Text(
          'Git 工作区已同步',
          style: TextStyle(fontSize: 12, color: AppColors.muted),
        ),
      ],
    );
  }
}
