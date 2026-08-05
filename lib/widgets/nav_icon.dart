import 'package:flutter/material.dart';

import '../models/workspace_models.dart';

/// 侧边栏导航图标。
///
/// 原型里这些图标是内联 SVG（20x20 viewBox、stroke-width 1.6、fill none）。
/// Flutter 里不引SVG 依赖，直接用 CustomPainter 按同样的坐标画，
/// 这样线宽和视觉重量能和设计稿保持一致。
class NavIcon extends StatelessWidget {
  const NavIcon(this.view, {super.key, required this.color, this.size = 16});

  final WorkbenchView view;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: size,
      width: size,
      child: CustomPaint(painter: _NavIconPainter(view, color)),
    );
  }
}

class _NavIconPainter extends CustomPainter {
  const _NavIconPainter(this.view, this.color);

  final WorkbenchView view;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    // 原型 viewBox 是 0 0 20 20，这里按实际尺寸等比缩放。
    final s = size.width / 20.0;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6 * s
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    Offset p(double x, double y) => Offset(x * s, y * s);

    switch (view) {
      case WorkbenchView.chat:
        // M4 4.5h12v8H8l-4 3v-11z —— 带尾巴的对话框
        final path = Path()
          ..moveTo(4 * s, 4.5 * s)
          ..lineTo(16 * s, 4.5 * s)
          ..lineTo(16 * s, 12.5 * s)
          ..lineTo(8 * s, 12.5 * s)
          ..lineTo(4 * s, 15.5 * s)
          ..close();
        canvas.drawPath(path, paint);

      case WorkbenchView.knowledge:
        // M4 3.5h12v13H4z + 两条横线—— 文档
        canvas.drawRect(
          Rect.fromLTRB(4 * s, 3.5 * s, 16 * s, 16.5 * s),
          paint,
        );
        canvas.drawLine(p(7, 7), p(13, 7), paint);
        canvas.drawLine(p(7, 10), p(13, 10), paint);

      case WorkbenchView.library:
        // M3.5 6.5h5l1.5 2H16.5v8H3.5z —— 文件夹
        final path = Path()
          ..moveTo(3.5 * s, 6.5 * s)
          ..lineTo(8.5 * s, 6.5 * s)
          ..lineTo(10 * s, 8.5 * s)
          ..lineTo(16.5 * s, 8.5 * s)
          ..lineTo(16.5 * s, 16.5 * s)
          ..lineTo(3.5 * s, 16.5 * s)
          ..close();
        canvas.drawPath(path, paint);

      case WorkbenchView.agents:
        // circle r5.5 + 四向刻度 —— 齿轮/节点
        canvas.drawCircle(p(10, 10), 5.5 * s, paint);
        canvas.drawLine(p(10, 4.5), p(10, 2.5), paint);
        canvas.drawLine(p(10, 17.5), p(10, 15.5), paint);
        canvas.drawLine(p(4.5, 10), p(2.5, 10), paint);
        canvas.drawLine(p(17.5, 10), p(15.5, 10), paint);

      case WorkbenchView.models:
        // M4 5h12v10H4z + 两条横线 —— 配置卡
        canvas.drawRect(Rect.fromLTRB(4 * s, 5 * s, 16 * s, 15 * s), paint);
        canvas.drawLine(p(7, 8), p(13, 8), paint);
        canvas.drawLine(p(7, 11), p(10, 11), paint);

      case WorkbenchView.git:
        // 两个节点 + 折线连接 —— git 分支
        canvas.drawCircle(p(6, 5), 2 * s, paint);
        canvas.drawCircle(p(14, 15), 2 * s, paint);
        final path = Path()
          ..moveTo(6 * s, 7 * s)
          ..lineTo(6 * s, 12 * s)
          ..arcToPoint(
            p(9, 15),
            radius: Radius.circular(3 * s),
            clockwise: false,
          )
          ..lineTo(12 * s, 15 * s);
        canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_NavIconPainter old) =>
      old.view != view || old.color != color;
}

/// Windows 风格的四格窗口标识。
class WindowsGlyph extends StatelessWidget {
  const WindowsGlyph({super.key});

  @override
  Widget build(BuildContext context) {
    const cell = SizedBox(
      height: 5,
      width: 5,
      child: ColoredBox(color: Color(0xFF4878C7)),
    );
    return const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [cell, SizedBox(width: 2), cell],
        ),
        SizedBox(height: 2),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [cell, SizedBox(width: 2), cell],
        ),
      ],
    );
  }
}
