import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';
import '../widgets/nav_icon.dart';

/// 左侧导航栏。对应原型 `.sidebar`。
class WorkbenchSidebar extends ConsumerWidget {
  const WorkbenchSidebar({super.key, required this.width});

  final double width;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(activeViewProvider);
    final gitBadge = ref.watch(gitBadgeCountProvider);

    return Container(
      width: width,
      decoration: const BoxDecoration(
        color: AppColors.sidebarBg,
        border: Border(right: BorderSide(color: AppColors.line)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(10, 14, 10, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const _NewChatButton(),
            const SizedBox(height: 16),
            const _SideLabel('工作台'),
            for (final view in WorkbenchView.values)
              _NavItem(
                view: view,
                active: view == active,
                badge: view == WorkbenchView.git && gitBadge > 0
                    ? gitBadge.toString()
                    : null,
                onTap: () =>
                    ref.read(activeViewProvider.notifier).state = view,
              ),
            const _RecentSection(),
          ],
        ),
      ),
    );
  }
}

class _NewChatButton extends ConsumerWidget {
  const _NewChatButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () =>
            ref.read(activeViewProvider.notifier).state = WorkbenchView.chat,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 9),
          decoration: BoxDecoration(
            color: AppColors.violet,
            borderRadius: BorderRadius.circular(AppRadius.sm + 2),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '+',
                style: TextStyle(
                  fontSize: 16,
                  height: 1,
                  color: Colors.white,
                  fontWeight: FontWeight.w400,
                ),
              ),
              SizedBox(width: 7),
              Text(
                '新建会话',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SideLabel extends StatelessWidget {
  const _SideLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(9, 13, 9, 5),
      child: Text(text, style: AppText.sideLabel),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.view,
    required this.active,
    required this.onTap,
    this.badge,
  });

  final WorkbenchView view;
  final bool active;
  final VoidCallback onTap;
  final String? badge;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.violetInk : AppColors.navText;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: HoverHighlight(
        onTap: onTap,
        enabled: !active,
        borderRadius: AppRadius.md,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
          decoration: BoxDecoration(
            color: active ? AppColors.violet50 : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Row(
            children: [
              NavIcon(view, color: color),
              const SizedBox(width: 9),
              Expanded(
                child: Text(
                  view.label,
                  style: active ? AppText.navItemActive : AppText.navItem,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (badge != null) _NavBadge(badge!),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavBadge extends StatelessWidget {
  const _NavBadge(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: const Color(0xFFF8E9E7),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 10, color: Color(0xFFB6493C)),
      ),
    );
  }
}

class _RecentSection extends StatelessWidget {
  const _RecentSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 18),
      padding: const EdgeInsets.only(top: 12),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.line)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SideLabel('最近会话'),
          for (final s in DemoData.recentSessions) _RecentItem(s),
        ],
      ),
    );
  }
}

class _RecentItem extends StatelessWidget {
  const _RecentItem(this.session);

  final SessionSummary session;

  @override
  Widget build(BuildContext context) {
    return HoverHighlight(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 7),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              session.title,
              style: const TextStyle(
                fontSize: 11,
                height: 1.35,
                color: AppColors.muted,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              session.subtitle,
              style: const TextStyle(fontSize: 10, color: Color(0xFFA3ACB9)),
            ),
          ],
        ),
      ),
    );
  }
}
