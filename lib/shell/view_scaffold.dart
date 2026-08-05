import 'package:flutter/material.dart';

import '../design/tokens.dart';

/// 每个视图顶部的标题栏。对应原型 `.view-header`，固定 64px高。
class ViewHeader extends StatelessWidget {
  const ViewHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.actions = const [],
  });

  final String title;
  final String subtitle;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: AppLayout.viewHeaderHeight,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.line)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppText.viewTitle,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: AppText.viewSubtitle,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (actions.isNotEmpty) const SizedBox(width: 12),
          for (var i = 0; i < actions.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            actions[i],
          ],
        ],
      ),
    );
  }
}

/// 视图骨架：头部 + 可滚动/填充的内容区。
class ViewScaffold extends StatelessWidget {
  const ViewScaffold({
    super.key,
    required this.header,
    required this.body,
  });

  final ViewHeader header;
  final Widget body;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        header,
        Expanded(child: body),
      ],
    );
  }
}
