import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_data.dart';
import '../design/tokens.dart';
import '../models/workspace_models.dart';
import '../shell/view_scaffold.dart';
import '../state/workbench_providers.dart';
import '../widgets/common.dart';

/// P1 主对话页。对应原型 `#view-chat`。
class ChatView extends ConsumerStatefulWidget {
  const ChatView({super.key});

  @override
  ConsumerState<ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends ConsumerState<ChatView> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text;
    if (text.trim().isEmpty) return;
    ref.read(messagesProvider.notifier).send(text);
    _controller.clear();
    // 等一帧让新消息完成布局，再滚到底部。
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider);

    return ViewScaffold(
      header: const ViewHeader(
        title: DemoData.sessionTitle,
        subtitle: DemoData.sessionSubtitle,
        actions: [GhostButton(label: '会话摘要')],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          //原型用 `padding: 28px 8.5%`，这里按容器宽度换算。
          final sidePad = constraints.maxWidth * 0.085;
          return Column(
            children: [
              Expanded(
                child: ListView(
                  controller: _scrollController,
                  padding: EdgeInsets.fromLTRB(sidePad, 28, sidePad, 16),
                  children: [
                    const _DateDivider('今天 16:42'),
                    for (final m in messages) _MessageRow(m),
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(sidePad, 0, sidePad, 22),
                child: _Composer(controller: _controller, onSend: _send),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _DateDivider extends StatelessWidget {
  const _DateDivider(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Text(
        label,
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 11, color: Color(0xFFA1A9B6)),
      ),
    );
  }
}

class _MessageRow extends StatelessWidget {
  const _MessageRow(this.message);

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final avatar = _Avatar(
      label: message.isUser ? '德' : 'FM',
      color: message.isUser ? AppColors.violet : AppColors.teal,
    );
    final bubble = Flexible(child: _Bubble(message));

    // 原型`.message { max-width: 760px; margin: 0 auto 20px }`：
    // 消息行整体作为一个 760px 的块居中，块内再决定气泡靠左还是靠右。
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 760),
        child: Row(
          mainAxisAlignment:
              message.isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: message.isUser
              ? [bubble, const SizedBox(width: 10), avatar]
              : [avatar, const SizedBox(width: 10), bubble],
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 28,
      width: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble(this.message);

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    // 用户气泡右上角是尖的，大副气泡左上角是尖的。
    final radius = isUser
        ? const BorderRadius.only(
            topLeft: Radius.circular(12),
            topRight: Radius.circular(4),
            bottomLeft: Radius.circular(12),
            bottomRight: Radius.circular(12),
          )
        : const BorderRadius.only(
            topLeft: Radius.circular(4),
            topRight: Radius.circular(12),
            bottomLeft: Radius.circular(12),
            bottomRight: Radius.circular(12),
          );

    return Container(
      constraints: const BoxConstraints(maxWidth: 620),
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
      decoration: BoxDecoration(
        color: isUser ? AppColors.violet : AppColors.bubbleBg,
        border: Border.all(
          color: isUser ? AppColors.violet : AppColors.bubbleBorder,
        ),
        borderRadius: radius,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _bubbleText(isUser),
          if (message.taskGroup != null) ...[
            const SizedBox(height: 12),
            _TaskCard(message.taskGroup!),
          ],
          if (message.citation != null) ...[
            const SizedBox(height: 8),
            _SourceCite(message.citation!),
          ],
        ],
      ),
    );
  }

  Widget _bubbleText(bool isUser) {
    final baseStyle = AppText.body.copyWith(
      color: isUser ? Colors.white : AppColors.text,
    );
    if (message.boldLead == null) {
      return Text(message.text, style: baseStyle);
    }
    // 对应原型里 `<strong>...</strong><br>正文` 的结构。
    return Text.rich(
      TextSpan(
        style: baseStyle,
        children: [
          TextSpan(
            text: '${message.boldLead}\n',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          TextSpan(text: message.text),
        ],
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  const _TaskCard(this.group);

  final TaskGroup group;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: const Color(0xFFDCE9E7)),
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFF6FBFA),
              border: Border(bottom: BorderSide(color: Color(0xFFE3EFED))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  group.title,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF4B625E)),
                ),
                Text(
                  group.note,
                  style: const TextStyle(fontSize: 11, color: Color(0xFF4B625E)),
                ),
              ],
            ),
          ),
          for (var i = 0; i < group.steps.length; i++)
            _TaskStepRow(
              step: group.steps[i],
              isLast: i == group.steps.length - 1,
            ),
        ],
      ),
    );
  }
}

class _TaskStepRow extends StatelessWidget {
  const _TaskStepRow({required this.step, required this.isLast});

  final TaskStep step;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: Color(0xFFEFF3F2))),
      ),
      child: Row(
        children: [
          Dot(
            color: step.status == TaskRunStatus.running
                ? const Color(0xFFE49500)
                : AppColors.success,
          ),
          const SizedBox(width: 7),
          Expanded(
            child: Text(
              step.label,
              style: const TextStyle(fontSize: 11, color: AppColors.text),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text(
            step.model,
            style: const TextStyle(fontSize: 10, color: Color(0xFF84908F)),
          ),
        ],
      ),
    );
  }
}

class _SourceCite extends StatelessWidget {
  const _SourceCite(this.path);

  final String path;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.blue50,
        border: Border.all(color: const Color(0xFFDBEAFA)),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        '引用：$path',
        style: const TextStyle(fontSize: 10, color: Color(0xFF4B6593)),
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.onSend});

  final TextEditingController controller;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 9),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.lineStrong),
        borderRadius: BorderRadius.circular(AppRadius.xl),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const SquareIconButton(child: Text('+')),
              const SizedBox(width: 8),
              Expanded(
                child: BareTextField(
                  hint: '向大副描述任务，或拖入素材文件...',
                  controller: controller,
                  onSubmitted: (_) => onSend(),
                ),
              ),
              const SizedBox(width: 8),
              _SendButton(onTap: onSend),
            ],
          ),
          const SizedBox(height: 10),
          const Row(
            children: [
              SquareIconButton(child: Text('@')),
              SizedBox(width: 7),
              SquareIconButton(child: Text('#')),
              Spacer(),
              Text(
                'Enter 发送 · Shift + Enter 换行',
                style: TextStyle(fontSize: 10, color: Color(0xFF9EA7B3)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SendButton extends StatelessWidget {
  const _SendButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 26,
          width: 32,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.violet,
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: const Text(
            '↑',
            style: TextStyle(fontSize: 14, color: Colors.white),
          ),
        ),
      ),
    );
  }
}
