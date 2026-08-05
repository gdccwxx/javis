import 'package:flutter/material.dart';

import '../design/tokens.dart';

/// 次要按钮。对应原型的 `.ghost`。
class GhostButton extends StatelessWidget {
  const GhostButton({
    super.key,
    required this.label,
    this.onPressed,
    this.expand = false,
  });

  final String label;
  final VoidCallback? onPressed;

  /// 检查器里的「查看变更」按钮是撑满宽度的。
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final button = _HoverTap(
      onTap: onPressed,
      builder: (hovered) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        alignment: expand ? Alignment.center : null,
        decoration: BoxDecoration(
          color: hovered ? AppColors.hoverBg : AppColors.surface,
          border: Border.all(color: AppColors.lineStrong),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Text(label, style: AppText.button),
      ),
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}

/// 主按钮。对应原型的 `.primary`。
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({super.key, required this.label, this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return _HoverTap(
      onTap: onPressed,
      builder: (hovered) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
        decoration: BoxDecoration(
          color: hovered
              ? Color.lerp(AppColors.violet, Colors.black, 0.08)
              : AppColors.violet,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Text(label, style: AppText.buttonPrimary),
      ),
    );
  }
}

/// 小方块图标按钮。对应 `.icon-btn`。
class SquareIconButton extends StatelessWidget {
  const SquareIconButton({
    super.key,
    required this.child,
    this.onPressed,
    this.size = 25,
  });

  final Widget child;
  final VoidCallback? onPressed;
  final double size;

  @override
  Widget build(BuildContext context) {
    return _HoverTap(
      onTap: onPressed,
      builder: (hovered) => Container(
        height: size,
        constraints: BoxConstraints(minWidth: size),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: hovered ? AppColors.hoverBg : AppColors.surface,
          border: Border.all(color: AppColors.line),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: DefaultTextStyle.merge(
          style: const TextStyle(fontSize: 14, color: Color(0xFF6D7888)),
          child: child,
        ),
      ),
    );
  }
}

/// 中性标签。对应 `.tag` 及其 `.violet` / `.green` 变体。
class Chip8 extends StatelessWidget {
  const Chip8(
    this.label, {
    super.key,
    this.background = AppColors.chipBg,
    this.foreground = const Color(0xFF687587),
    this.fontWeight = FontWeight.w400,
  });

  const Chip8.violet(String label, {Key? key})
      : this(
          label,
          key: key,
          background: AppColors.violet50,
          foreground: const Color(0xFF5843C0),
        );

  const Chip8.green(String label, {Key? key})
      : this(
          label,
          key: key,
          background: AppColors.teal50,
          foreground: AppColors.teal,
        );

  const Chip8.amber(String label, {Key? key})
      : this(
          label,
          key: key,
          background: AppColors.amber50,
          foreground: AppColors.amber,
        );

  final String label;
  final Color background;
  final Color foreground;
  final FontWeight fontWeight;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadius.xs),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, color: foreground, fontWeight: fontWeight),
      ),
    );
  }
}

///胶囊状态徽标。对应 `.status.ok` / `.status.off`。
class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.ok});

  final String label;
  final bool ok;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: ok ? AppColors.teal50 : const Color(0xFFF2F4F6),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: ok ? AppColors.teal : const Color(0xFF7D8896),
        ),
      ),
    );
  }
}

/// 文件类型角标。对应 `.file-type`。
class FileTypeBadge extends StatelessWidget {
  const FileTypeBadge(this.label, {super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.amber50,
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: Color(0xFF775F00),
        ),
      ),
    );
  }
}

/// 左侧竖条提示框。对应 `.notice`。
class NoticeBox extends StatelessWidget {
  const NoticeBox(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
      decoration: const BoxDecoration(
        color: AppColors.amber50,
        border: Border(left: BorderSide(color: AppColors.amber, width: 3)),
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(AppRadius.sm),
          bottomRight: Radius.circular(AppRadius.sm),
        ),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          height: 1.5,
          color: Color(0xFF775722),
        ),
      ),
    );
  }
}

/// 紫色结论块。对应 `.callout`。
class CalloutBox extends StatelessWidget {
  const CalloutBox(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.violet50,
        border: Border(left: BorderSide(color: AppColors.violet, width: 3)),
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(AppRadius.sm),
          bottomRight: Radius.circular(AppRadius.sm),
        ),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 12,
          height: 1.6,
          color: Color(0xFF4531A8),
        ),
      ),
    );
  }
}

/// 等宽代码块。对应 `.code-block`。
class CodeBlock extends StatelessWidget {
  const CodeBlock(this.code, {super.key});

  final String code;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.bubbleBg,
        border: Border.all(color: const Color(0xFFEEF0F3)),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Text(code, style: AppText.mono),
    );
  }
}

/// 卡片外壳。素材卡、Agent 卡等共用。
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(15),
    this.minHeight,
    this.borderRadius = AppRadius.lg + 1,
  });

  final Widget child;
  final EdgeInsets padding;
  final double? minHeight;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: minHeight == null ? null : BoxConstraints(minHeight: minHeight!),
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.line),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: child,
    );
  }
}

/// 只读展示用的输入框外观。对应 `.searchbox` 占位样式。
class FauxInput extends StatelessWidget {
  const FauxInput({super.key, required this.hint, this.expand = true});

  final String hint;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final box = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: AppColors.lineStrong),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Text(
        hint,
        style: const TextStyle(fontSize: 12, color: Color(0xFF8C96A5)),
      ),
    );
    return expand ? Expanded(child: box) : box;
  }
}

/// 带边框的真实输入框，样式对齐原型。
class PlainTextField extends StatelessWidget {
  const PlainTextField({
    super.key,
    required this.hint,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.fontSize = 12,
    this.dense = false,
    this.focusNode,
    this.maxLines = 1,
  });

  final String hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final double fontSize;
  final bool dense;
  final FocusNode? focusNode;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      maxLines: maxLines,
      cursorColor: AppColors.violet,
      cursorWidth: 1.5,
      style: TextStyle(fontSize: fontSize, color: AppColors.text),
      decoration: InputDecoration(
        isDense: true,
        hintText: hint,
        hintStyle: TextStyle(fontSize: fontSize, color: const Color(0xFF9AA4B2)),
        contentPadding: EdgeInsets.symmetric(
          horizontal:8,
          vertical: dense ? 7 : 8,
        ),
        filled: true,
        fillColor: AppColors.surface,
        border: _border(AppColors.lineStrong),
        enabledBorder: _border(AppColors.lineStrong),
        focusedBorder: _border(AppColors.violet),
      ),
    );
  }

  OutlineInputBorder _border(Color color) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.sm),
        borderSide: BorderSide(color: color),
      );
}

/// 无边框的透明输入框，用于对话输入区。
class BareTextField extends StatelessWidget {
  const BareTextField({
    super.key,
    required this.hint,
    this.controller,
    this.focusNode,
    this.onSubmitted,
  });

  final String hint;
  final TextEditingController? controller;
  final FocusNode? focusNode;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      onSubmitted: onSubmitted,
      minLines: 1,
      maxLines: 5,
      cursorColor: AppColors.violet,
      cursorWidth: 1.5,
      style: const TextStyle(fontSize: 13, color: AppColors.text, height: 1.5),
      decoration: InputDecoration(
        isDense: true,
        border: InputBorder.none,
        enabledBorder: InputBorder.none,
        focusedBorder: InputBorder.none,
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF9AA4B2)),
        contentPadding: EdgeInsets.zero,
      ),
    );
  }
}

/// 小圆点。任务状态和同步指示器共用。
class Dot extends StatelessWidget {
  const Dot({super.key, required this.color, this.size = 7});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

/// 统一的 hover +点击反馈封装。
///
/// Flutter 没有 CSS `:hover`，桌面端要靠 MouseRegion 自己实现，
/// 这里包一层避免每个组件重复写。
class _HoverTap extends StatefulWidget {
  const _HoverTap({required this.builder, this.onTap});

  final Widget Function(bool hovered) builder;
  final VoidCallback? onTap;

  @override
  State<_HoverTap> createState() => _HoverTapState();
}

class _HoverTapState extends State<_HoverTap> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: widget.builder(_hovered),
      ),
    );
  }
}

/// 供外部复用的 hover 容器。
class HoverHighlight extends StatefulWidget {
  const HoverHighlight({
    super.key,
    required this.child,
    this.onTap,
    this.hoverColor = AppColors.hoverBg,
    this.borderRadius = AppRadius.sm,
    this.enabled = true,
  });

  final Widget child;
  final VoidCallback? onTap;
  final Color hoverColor;
  final double borderRadius;

  /// 选中态下不需要 hover 变色。
  final bool enabled;

  @override
  State<HoverHighlight> createState() => _HoverHighlightState();
}

class _HoverHighlightState extends State<HoverHighlight> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final showHover = widget.enabled && _hovered;
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: showHover ? widget.hoverColor : Colors.transparent,
            borderRadius: BorderRadius.circular(widget.borderRadius),
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
