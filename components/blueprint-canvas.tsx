'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ElevatorConfigState,
  ElevatorCalculationResults,
} from '@/lib/elevator-calculator';
import { generateElevatorPdf } from '@/lib/elevator-pdf';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink,
  Copy,
  Check,
  X,
  Eye,
  FileImage,
  Printer,
  Sparkles,
  FileDown,
  Loader2,
} from 'lucide-react';

interface BlueprintCanvasProps {
  state: ElevatorConfigState;
  results: ElevatorCalculationResults;
  activeTab?: string;
  onOpenBlueprintTab?: () => void;
}

export function BlueprintCanvas({
  state,
  results,
  activeTab,
}: BlueprintCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Export Modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportImageUrl, setExportImageUrl] = useState<string | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingExport, setIsGeneratingExport] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdfClick = async () => {
    setIsGeneratingPdf(true);
    try {
      let dataUrl: string | undefined = undefined;
      try {
        const offCanvas = document.createElement('canvas');
        const exportW = 2400;
        const exportH = 1600;
        offCanvas.width = exportW;
        offCanvas.height = exportH;
        const offCtx = offCanvas.getContext('2d');
        if (offCtx) {
          renderBlueprintToContext(offCtx, exportW, exportH, 1, true);
          dataUrl = offCanvas.toDataURL('image/png', 0.95);
        }
      } catch (err) {
        console.warn('Fallback to screen canvas for PDF:', err);
        if (canvasRef.current) {
          dataUrl = canvasRef.current.toDataURL('image/png');
        }
      }

      await generateElevatorPdf({
        state,
        results,
        blueprintDataUrl: dataUrl,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Core drawing routine that can render to any canvas (on-screen or high-res offscreen)
  const renderBlueprintToContext = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      currentZoom = 1,
      isHighResExport = false
    ) => {
      // Background
      ctx.fillStyle = '#081426';
      ctx.fillRect(0, 0, width, height);

      // Save base state
      ctx.save();

      // Apply zoom if interactive
      if (currentZoom !== 1) {
        ctx.translate(width / 2, height / 2);
        ctx.scale(currentZoom, currentZoom);
        ctx.translate(-width / 2, -height / 2);
      }

      // 1. Technical Grid
      const gridSize = isHighResExport ? 48 : 24;
      for (let x = 0; x <= width; x += gridSize) {
        const isMajor = Math.floor(x / gridSize) % 4 === 0;
        ctx.beginPath();
        ctx.strokeStyle = isMajor
          ? 'rgba(100, 255, 218, 0.16)'
          : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = isMajor
          ? isHighResExport
            ? 2.5
            : 1.5
          : isHighResExport
          ? 1.5
          : 0.8;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        const isMajor = Math.floor(y / gridSize) % 4 === 0;
        ctx.beginPath();
        ctx.strokeStyle = isMajor
          ? 'rgba(100, 255, 218, 0.16)'
          : 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = isMajor
          ? isHighResExport
            ? 2.5
            : 1.5
          : isHighResExport
          ? 1.5
          : 0.8;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Geometry values with safe fallbacks
      const larguraPoco = Number(results.larguraPoco) || 1700;
      const profundidadePoco = Number(results.profundidadePoco) || 1545;
      const larguraCabine = parseFloat(state.larguraCabine) || 800;
      const profundidadeCabine = parseFloat(state.profundidadeCabine) || 1250;
      const aberturaPorta = parseFloat(state.aberturaPorta) || 800;
      const espacoChassis = Number(results.espacoChassis) || 450;
      const menorFolga = Number(results.menorFolga) || 125;
      const numeroPassageiros = results.numeroPassageiros ?? 5;
      const cargaUtilKg = results.cargaUtilKg ?? 375;
      const areaCabineM2 = results.areaCabineM2 ?? 1.0;

      // Margins & Scale calculation
      const isCompact = width < 600 && !isHighResExport;
      const leftPadding = isHighResExport ? 160 : isCompact ? 36 : 64;
      const rightPadding = isHighResExport ? 160 : isCompact ? 36 : 64;
      const topPadding = isHighResExport ? 150 : isCompact ? 54 : 68;
      const bottomPadding = isHighResExport ? 180 : isCompact ? 60 : 86;

      const availW = Math.max(width - (leftPadding + rightPadding), 100);
      const availH = Math.max(height - (topPadding + bottomPadding), 100);

      const scale = Math.min(availW / larguraPoco, availH / profundidadePoco);
      const pocoDrawWidth = larguraPoco * scale;
      const pocoDrawHeight = profundidadePoco * scale;
      const cabineDrawWidth = larguraCabine * scale;
      const cabineDrawHeight = profundidadeCabine * scale;
      const isDoorOnDepth = (state.ladoPorta || 'Largura') === 'Profundidade';
      const ladoFaceMm = isDoorOnDepth ? profundidadeCabine : larguraCabine;
      const ladoFaceDraw = isDoorOnDepth ? cabineDrawHeight : cabineDrawWidth;
      const isPortaMenor = aberturaPorta < ladoFaceMm;

      const doorDrawWidth = Math.min(
        aberturaPorta * scale,
        ladoFaceDraw - (isHighResExport ? 8 : 4)
      );
      const espChassisScaled = espacoChassis * scale;

      const pocoLeft = leftPadding + (availW - pocoDrawWidth) / 2;
      const pocoTop = topPadding + (availH - pocoDrawHeight) / 2;
      const wallThickness = isHighResExport ? 22 : isCompact ? 10 : 12;

      const isChassisSide = state.ladoArcada === 'Lateral';
      const isElectric = state.acionamento === 'Elétrico';
      const isSuspension = state.arcada === 'Suspensão';
      const isEntranceOpposite = state.tipoEntrada === 'Oposta';
      const isEntranceAdjacent = state.tipoEntrada === 'Adjacente';

      let cbX: number;
      let cbY: number;

      if (isChassisSide) {
        const leftClearance = espChassisScaled;
        const availShaftInteriorX = pocoDrawWidth - cabineDrawWidth;
        cbX = pocoLeft + Math.min(leftClearance, availShaftInteriorX * 0.72);

        const rearClearance = (isEntranceOpposite ? 160 : 120) * scale;
        const availShaftInteriorY = pocoDrawHeight - cabineDrawHeight;
        cbY = pocoTop + Math.min(rearClearance, availShaftInteriorY * 0.5);
      } else {
        const rearClearance = espChassisScaled;
        const availShaftInteriorY = pocoDrawHeight - cabineDrawHeight;
        cbY = pocoTop + Math.min(rearClearance, availShaftInteriorY * 0.72);
        cbX = pocoLeft + (pocoDrawWidth - cabineDrawWidth) / 2;
      }

      const cbRight = cbX + cabineDrawWidth;
      const cbBottom = cbY + cabineDrawHeight;
      const cbCenterX = cbX + cabineDrawWidth / 2;
      const cbCenterY = cbY + cabineDrawHeight / 2;

      // 2. Concrete Walls with Hatching
      ctx.fillStyle = 'rgba(100, 255, 218, 0.08)';
      ctx.fillRect(
        pocoLeft - wallThickness,
        pocoTop - wallThickness,
        pocoDrawWidth + wallThickness * 2,
        pocoDrawHeight + wallThickness * 2
      );

      ctx.fillStyle = '#081426';
      ctx.fillRect(pocoLeft, pocoTop, pocoDrawWidth, pocoDrawHeight);

      // Hatching lines on concrete walls
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        pocoLeft - wallThickness,
        pocoTop - wallThickness,
        pocoDrawWidth + wallThickness * 2,
        pocoDrawHeight + wallThickness * 2
      );
      ctx.rect(pocoLeft, pocoTop, pocoDrawWidth, pocoDrawHeight);
      ctx.clip('evenodd');

      ctx.strokeStyle = 'rgba(100, 255, 218, 0.18)';
      ctx.lineWidth = isHighResExport ? 1.8 : 1;
      const hatchStep = isHighResExport ? 18 : 10;
      const totalSpan = pocoDrawWidth + pocoDrawHeight + wallThickness * 4;
      for (let i = -pocoDrawHeight; i < totalSpan; i += hatchStep) {
        ctx.beginPath();
        ctx.moveTo(pocoLeft - wallThickness + i, pocoTop - wallThickness);
        ctx.lineTo(
          pocoLeft - wallThickness + i + (isHighResExport ? 40 : 24),
          pocoTop - wallThickness + (isHighResExport ? 40 : 24)
        );
        ctx.stroke();
      }
      ctx.restore();

      // Wall outlines
      ctx.strokeStyle = '#90CDF4';
      ctx.lineWidth = isHighResExport ? 2.5 : 1.5;
      ctx.strokeRect(
        pocoLeft - wallThickness,
        pocoTop - wallThickness,
        pocoDrawWidth + wallThickness * 2,
        pocoDrawHeight + wallThickness * 2
      );

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = isHighResExport ? 4 : 2.5;
      ctx.strokeRect(pocoLeft, pocoTop, pocoDrawWidth, pocoDrawHeight);

      // 3. Door Openings in Walls (Cutouts)
      const frontDoorLeft = cbX + (cabineDrawWidth - doorDrawWidth) / 2;
      const sideDoorTop = cbY + (cabineDrawHeight - doorDrawWidth) / 2;

      // Front Wall Cutout (Bottom) - if door is installed on width face
      if (!isDoorOnDepth) {
        ctx.fillStyle = '#081426';
        ctx.fillRect(
          frontDoorLeft,
          pocoTop + pocoDrawHeight - 1.5,
          doorDrawWidth,
          wallThickness + 6
        );
      }

      // Rear Wall Cutout (Top) if Opposite entrance
      if (isEntranceOpposite) {
        const rearDoorLeft = cbX + (cabineDrawWidth - doorDrawWidth) / 2;
        ctx.fillStyle = '#081426';
        ctx.fillRect(
          rearDoorLeft,
          pocoTop - wallThickness - 3,
          doorDrawWidth,
          wallThickness + 6
        );
      }

      // Side Wall Cutout (Right) if Adjacent entrance OR door is on depth face
      if (isEntranceAdjacent || isDoorOnDepth) {
        ctx.fillStyle = '#081426';
        ctx.fillRect(
          pocoLeft + pocoDrawWidth - 1.5,
          sideDoorTop,
          wallThickness + 6,
          doorDrawWidth
        );
      }

      // Helper functions for components
      const drawGuideRail = (
        rx: number,
        ry: number,
        angleDeg: number,
        color = '#ECEFF1'
      ) => {
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate((angleDeg * Math.PI) / 180);
        ctx.fillStyle = color;
        const rw = isHighResExport ? 9 : 5;
        const rh = isHighResExport ? 13 : 7;
        ctx.fillRect(-rw / 2, 0, rw, rh);
        ctx.fillRect(-rw, rh, rw * 2, rh / 2.2);
        ctx.restore();
      };

      const drawCounterweight = (
        cx: number,
        cy: number,
        cw: number,
        ch: number,
        color: string
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = isHighResExport ? 3.5 : 2;
        ctx.strokeRect(cx, cy, cw, ch);

        const divisions = 3;
        const step = ch / divisions;
        ctx.strokeStyle = `${color}99`;
        ctx.lineWidth = isHighResExport ? 2 : 1;
        for (let i = 1; i < divisions; i++) {
          ctx.beginPath();
          ctx.moveTo(cx, cy + i * step);
          ctx.lineTo(cx + cw, cy + i * step);
          ctx.stroke();
        }

        // Diagonal cross
        ctx.strokeStyle = `${color}CC`;
        ctx.lineWidth = isHighResExport ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + cw, cy + ch);
        ctx.moveTo(cx + cw, cy);
        ctx.lineTo(cx, cy + ch);
        ctx.stroke();
      };

      const drawHydraulicPiston = (
        centerX: number,
        centerY: number,
        radius: number,
        color: string
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = isHighResExport ? 3.5 : 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = isHighResExport ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, isHighResExport ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(centerX - radius * 1.3, centerY);
        ctx.lineTo(centerX + radius * 1.3, centerY);
        ctx.stroke();
      };

      // 4. Drive Elements: Counterweight vs Hydraulic
      const accentOrange = '#FFAB40';
      const hydraulicBlue = '#00E5FF';
      let driveCenterX = 0;
      let driveCenterY = 0;

      if (isChassisSide) {
        const spaceX = cbX - pocoLeft;
        driveCenterX = pocoLeft + spaceX / 2;
        driveCenterY =
          state.posicao === 'Deslocado'
            ? pocoTop + pocoDrawHeight * 0.28
            : cbCenterY;

        if (isElectric) {
          const cpWidth = Math.max(
            isHighResExport ? 28 : 16,
            Math.min(spaceX * 0.42, isHighResExport ? 52 : 28)
          );
          const cpHeight = Math.max(
            isHighResExport ? 70 : 40,
            Math.min(cabineDrawHeight * 0.65, isHighResExport ? 200 : 120)
          );
          const cpLeft = driveCenterX - cpWidth / 2;
          const cpTop = driveCenterY - cpHeight / 2;
          drawCounterweight(cpLeft, cpTop, cpWidth, cpHeight, accentOrange);
          drawGuideRail(driveCenterX, cpTop, 0);
          drawGuideRail(driveCenterX, cpTop + cpHeight, 180);
        } else {
          const pistonRadius = Math.max(
            isHighResExport ? 18 : 10,
            Math.min(spaceX * 0.28, isHighResExport ? 38 : 22)
          );
          drawHydraulicPiston(
            driveCenterX,
            driveCenterY,
            pistonRadius,
            hydraulicBlue
          );
          drawGuideRail(driveCenterX, driveCenterY - pistonRadius - 4, 0);
          drawGuideRail(driveCenterX, driveCenterY + pistonRadius + 4, 180);
        }
      } else {
        const spaceY = cbY - pocoTop;
        driveCenterY = pocoTop + spaceY / 2;
        driveCenterX =
          state.posicao === 'Deslocado'
            ? pocoLeft + pocoDrawWidth * 0.25
            : cbCenterX;

        if (isElectric) {
          const cpWidth = Math.max(
            isHighResExport ? 70 : 40,
            Math.min(cabineDrawWidth * 0.65, isHighResExport ? 240 : 140)
          );
          const cpHeight = Math.max(
            isHighResExport ? 28 : 16,
            Math.min(spaceY * 0.45, isHighResExport ? 50 : 28)
          );
          const cpLeft = driveCenterX - cpWidth / 2;
          const cpTop = driveCenterY - cpHeight / 2;
          drawCounterweight(cpLeft, cpTop, cpWidth, cpHeight, accentOrange);
          drawGuideRail(cpLeft, driveCenterY, -90);
          drawGuideRail(cpLeft + cpWidth, driveCenterY, 90);
        } else {
          const pistonRadius = Math.max(
            isHighResExport ? 18 : 10,
            Math.min(spaceY * 0.32, isHighResExport ? 38 : 22)
          );
          drawHydraulicPiston(
            driveCenterX,
            driveCenterY,
            pistonRadius,
            hydraulicBlue
          );
          drawGuideRail(driveCenterX - pistonRadius - 4, driveCenterY, -90);
          drawGuideRail(driveCenterX + pistonRadius + 4, driveCenterY, 90);
        }
      }

      // 5. Arcada / Sling Structure
      const slingColor = 'rgba(100, 255, 218, 0.85)';
      ctx.strokeStyle = slingColor;
      ctx.lineWidth = isHighResExport ? 4.5 : 2.5;

      if (isSuspension) {
        ctx.beginPath();
        ctx.moveTo(cbX - 4, cbCenterY);
        ctx.lineTo(cbRight + 4, cbCenterY);
        ctx.stroke();

        drawGuideRail(cbX, cbCenterY, -90);
        drawGuideRail(cbRight, cbCenterY, 90);
      } else {
        if (isChassisSide) {
          ctx.strokeRect(
            cbX - 4,
            cbCenterY - (isHighResExport ? 24 : 14),
            isHighResExport ? 14 : 8,
            isHighResExport ? 48 : 28
          );
          ctx.beginPath();
          ctx.moveTo(cbX, cbCenterY - (isHighResExport ? 24 : 14));
          ctx.lineTo(
            cbX + cabineDrawWidth * 0.6,
            cbCenterY - (isHighResExport ? 24 : 14)
          );
          ctx.moveTo(cbX, cbCenterY + (isHighResExport ? 24 : 14));
          ctx.lineTo(
            cbX + cabineDrawWidth * 0.6,
            cbCenterY + (isHighResExport ? 24 : 14)
          );
          ctx.stroke();

          drawGuideRail(cbX, cbCenterY - (isHighResExport ? 24 : 14), -90);
          drawGuideRail(cbX, cbCenterY + (isHighResExport ? 24 : 14), -90);
        } else {
          ctx.strokeRect(
            cbCenterX - (isHighResExport ? 24 : 14),
            cbY - 4,
            isHighResExport ? 48 : 28,
            isHighResExport ? 14 : 8
          );
          ctx.beginPath();
          ctx.moveTo(cbCenterX - (isHighResExport ? 24 : 14), cbY);
          ctx.lineTo(
            cbCenterX - (isHighResExport ? 24 : 14),
            cbY + cabineDrawHeight * 0.6
          );
          ctx.moveTo(cbCenterX + (isHighResExport ? 24 : 14), cbY);
          ctx.lineTo(
            cbCenterX + (isHighResExport ? 24 : 14),
            cbY + cabineDrawHeight * 0.6
          );
          ctx.stroke();

          drawGuideRail(cbCenterX - (isHighResExport ? 24 : 14), cbY, 0);
          drawGuideRail(cbCenterX + (isHighResExport ? 24 : 14), cbY, 0);
        }
      }

      // 6. Cabin Walls and Interior
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = isHighResExport ? 4.5 : 2.5;

      const montanteDraw = Math.max(0, (ladoFaceDraw - doorDrawWidth) / 2);

      if (!isDoorOnDepth) {
        // Back wall, left wall, right wall
        ctx.beginPath();
        ctx.moveTo(cbX, cbBottom);
        ctx.lineTo(cbX, cbY);
        ctx.lineTo(cbRight, cbY);
        ctx.lineTo(cbRight, cbBottom);
        ctx.stroke();

        // Front wall with door opening and solid montante columns
        ctx.beginPath();
        ctx.moveTo(cbX, cbBottom);
        ctx.lineTo(frontDoorLeft, cbBottom);
        ctx.moveTo(frontDoorLeft + doorDrawWidth, cbBottom);
        ctx.lineTo(cbRight, cbBottom);
        ctx.stroke();

        // Solid return columns (montantes frontais)
        if (montanteDraw > 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          const mThick = isHighResExport ? 8 : 4;
          ctx.fillRect(cbX, cbBottom - mThick, montanteDraw, mThick);
          ctx.fillRect(
            cbRight - montanteDraw,
            cbBottom - mThick,
            montanteDraw,
            mThick
          );
        }
      } else {
        // Door is on depth face (side)
        ctx.beginPath();
        ctx.moveTo(cbRight, cbBottom);
        ctx.lineTo(cbX, cbBottom);
        ctx.lineTo(cbX, cbY);
        ctx.lineTo(cbRight, cbY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cbRight, cbY);
        ctx.lineTo(cbRight, sideDoorTop);
        ctx.moveTo(cbRight, sideDoorTop + doorDrawWidth);
        ctx.lineTo(cbRight, cbBottom);
        ctx.stroke();

        if (montanteDraw > 1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          const mThick = isHighResExport ? 8 : 4;
          ctx.fillRect(cbRight - mThick, cbY, mThick, montanteDraw);
          ctx.fillRect(
            cbRight - mThick,
            cbBottom - montanteDraw,
            mThick,
            montanteDraw
          );
        }
      }

      // Inner cyan finish
      ctx.strokeStyle = 'rgba(100, 255, 218, 0.55)';
      ctx.lineWidth = isHighResExport ? 2 : 1;
      ctx.strokeRect(
        cbX + (isHighResExport ? 4 : 2.5),
        cbY + (isHighResExport ? 4 : 2.5),
        cabineDrawWidth - (isHighResExport ? 8 : 5),
        cabineDrawHeight - (isHighResExport ? 8 : 5)
      );

      // Center Crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = isHighResExport ? 2 : 1;
      const chSize = isHighResExport ? 14 : 8;
      ctx.beginPath();
      ctx.moveTo(cbCenterX - chSize, cbCenterY);
      ctx.lineTo(cbCenterX + chSize, cbCenterY);
      ctx.moveTo(cbCenterX, cbCenterY - chSize);
      ctx.lineTo(cbCenterX, cbCenterY + chSize);
      ctx.stroke();

      // 7. Doors (Sliding Leaves)
      const drawSlidingDoors = (
        doorType: string,
        doorStart: number,
        doorWidth: number,
        cabY: number,
        landY: number,
        isVertical: boolean
      ) => {
        const numLeaves = doorType.includes('4 Folhas')
          ? 4
          : doorType.includes('3 Folhas')
          ? 3
          : 2;
        const isCentral = doorType.includes('Central');

        ctx.save();
        const leafThick = isHighResExport ? 4 : 2.5;
        const stepDist = isHighResExport ? 4.5 : 2.5;

        if (!isVertical) {
          if (isCentral) {
            const halfWidth = doorWidth / 2;
            const leafWidth = halfWidth / (numLeaves / 2);
            for (let i = 0; i < numLeaves / 2; i++) {
              const step = i * stepDist;
              const lx1 = doorStart + i * leafWidth;
              const lx2 = lx1 + leafWidth - (isHighResExport ? 2.5 : 1.5);
              ctx.strokeStyle = '#64FFDA';
              ctx.lineWidth = leafThick;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(lx1, cabY + 2 + step);
              ctx.lineTo(lx2, cabY + 2 + step);
              ctx.stroke();

              ctx.strokeStyle = '#B0BEC5';
              ctx.lineWidth = leafThick * 0.8;
              ctx.beginPath();
              ctx.moveTo(lx1, landY + step);
              ctx.lineTo(lx2, landY + step);
              ctx.stroke();

              const rx2 = doorStart + doorWidth - i * leafWidth;
              const rx1 = rx2 - leafWidth + (isHighResExport ? 2.5 : 1.5);
              ctx.strokeStyle = '#64FFDA';
              ctx.lineWidth = leafThick;
              ctx.beginPath();
              ctx.moveTo(rx1, cabY + 2 + step);
              ctx.lineTo(rx2, cabY + 2 + step);
              ctx.stroke();

              ctx.strokeStyle = '#B0BEC5';
              ctx.lineWidth = leafThick * 0.8;
              ctx.beginPath();
              ctx.moveTo(rx1, landY + step);
              ctx.lineTo(rx2, landY + step);
              ctx.stroke();
            }
          } else {
            const leafWidth = doorWidth / numLeaves;
            for (let i = 0; i < numLeaves; i++) {
              const step = i * stepDist;
              const x1 = doorStart + i * leafWidth;
              const x2 = x1 + leafWidth - (isHighResExport ? 2.5 : 1.5);
              ctx.strokeStyle = '#64FFDA';
              ctx.lineWidth = leafThick;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(x1, cabY + 2 + step);
              ctx.lineTo(x2, cabY + 2 + step);
              ctx.stroke();

              ctx.strokeStyle = '#B0BEC5';
              ctx.lineWidth = leafThick * 0.8;
              ctx.beginPath();
              ctx.moveTo(x1, landY + step);
              ctx.lineTo(x2, landY + step);
              ctx.stroke();
            }
          }
        } else {
          const leafHeight = doorWidth / numLeaves;
          for (let i = 0; i < numLeaves; i++) {
            const step = i * stepDist;
            const y1 = doorStart + i * leafHeight;
            const y2 = y1 + leafHeight - (isHighResExport ? 2.5 : 1.5);
            ctx.strokeStyle = '#64FFDA';
            ctx.lineWidth = leafThick;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cabY + 2 + step, y1);
            ctx.lineTo(cabY + 2 + step, y2);
            ctx.stroke();

            ctx.strokeStyle = '#B0BEC5';
            ctx.lineWidth = leafThick * 0.8;
            ctx.beginPath();
            ctx.moveTo(landY + step, y1);
            ctx.lineTo(landY + step, y2);
            ctx.stroke();
          }
        }
        ctx.restore();
      };

      // Door rendering (Front or Side based on ladoPorta)
      if (!isDoorOnDepth) {
        drawSlidingDoors(
          state.tipoPorta,
          frontDoorLeft,
          doorDrawWidth,
          cbBottom,
          pocoTop + pocoDrawHeight + wallThickness / 2,
          false
        );
      } else {
        drawSlidingDoors(
          state.tipoPorta,
          sideDoorTop,
          doorDrawWidth,
          cbRight,
          pocoLeft + pocoDrawWidth + wallThickness / 2,
          true
        );
      }

      // Opposite door
      if (isEntranceOpposite) {
        const rearDoorLeft = cbX + (cabineDrawWidth - doorDrawWidth) / 2;
        drawSlidingDoors(
          state.tipoPorta,
          rearDoorLeft,
          doorDrawWidth,
          cbY,
          pocoTop - wallThickness / 2,
          false
        );
      }

      // Adjacent door (when entrance is adjacent and primary door is on width)
      if (isEntranceAdjacent && !isDoorOnDepth) {
        drawSlidingDoors(
          state.tipoPorta,
          sideDoorTop,
          doorDrawWidth,
          cbRight,
          pocoLeft + pocoDrawWidth + wallThickness / 2,
          true
        );
      }

      // 8. Technical Cotas & Dimensions
      const drawDim = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        label: string,
        isHoriz: boolean,
        offsetPx: number,
        color = '#FFFFFF',
        font = isHighResExport
          ? 'bold 18px ui-monospace, monospace'
          : '10px ui-monospace, monospace'
      ) => {
        const tick = isHighResExport ? 7 : 4;
        ctx.save();
        ctx.font = font;

        if (isHoriz) {
          const y = y1 + offsetPx;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = isHighResExport ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();

          ctx.strokeStyle = color;
          ctx.lineWidth = isHighResExport ? 2.8 : 1.5;
          ctx.beginPath();
          ctx.moveTo(x1 - tick, y + tick);
          ctx.lineTo(x1 + tick, y - tick);
          ctx.moveTo(x2 - tick, y + tick);
          ctx.lineTo(x2 + tick, y - tick);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = isHighResExport ? 1.2 : 0.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1, y);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2, y);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = offsetPx > 0 ? 'top' : 'bottom';
          ctx.fillText(label, (x1 + x2) / 2, y + (offsetPx > 0 ? 3 : -3));
        } else {
          const x = x1 + offsetPx;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = isHighResExport ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
          ctx.stroke();

          ctx.strokeStyle = color;
          ctx.lineWidth = isHighResExport ? 2.8 : 1.5;
          ctx.beginPath();
          ctx.moveTo(x - tick, y1 + tick);
          ctx.lineTo(x + tick, y1 - tick);
          ctx.moveTo(x - tick, y2 + tick);
          ctx.lineTo(x + tick, y2 - tick);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = isHighResExport ? 1.2 : 0.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x, y1);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.stroke();

          ctx.fillStyle = color;
          ctx.textAlign = offsetPx > 0 ? 'left' : 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, x + (offsetPx > 0 ? 5 : -5), (y1 + y2) / 2);
        }
        ctx.restore();
      };

      const cotaOffset = isHighResExport ? -38 : isCompact ? -18 : -22;
      const cotaOffsetPos = isHighResExport ? 34 : isCompact ? 14 : 18;

      // Shaft Dimensions
      drawDim(
        pocoLeft,
        pocoTop,
        pocoLeft + pocoDrawWidth,
        pocoTop,
        `LP: ${larguraPoco} mm`,
        true,
        cotaOffset,
        '#64FFDA',
        isHighResExport
          ? 'bold 20px ui-monospace, monospace'
          : 'bold 11px ui-monospace, monospace'
      );
      drawDim(
        pocoLeft,
        pocoTop,
        pocoLeft,
        pocoTop + pocoDrawHeight,
        `PP: ${profundidadePoco} mm`,
        false,
        cotaOffset,
        '#64FFDA',
        isHighResExport
          ? 'bold 20px ui-monospace, monospace'
          : 'bold 11px ui-monospace, monospace'
      );

      // Cabin Dimensions
      drawDim(
        cbX,
        cbBottom,
        cbRight,
        cbBottom,
        `LC: ${state.larguraCabine} mm`,
        true,
        cotaOffsetPos,
        '#FFFFFF',
        isHighResExport
          ? 'bold 17px ui-monospace, monospace'
          : '10px ui-monospace, monospace'
      );
      drawDim(
        cbRight,
        cbY,
        cbRight,
        cbBottom,
        `PC: ${state.profundidadeCabine} mm`,
        false,
        cotaOffsetPos,
        '#FFFFFF',
        isHighResExport
          ? 'bold 17px ui-monospace, monospace'
          : '10px ui-monospace, monospace'
      );

      // Door Opening
      if (!isDoorOnDepth) {
        drawDim(
          frontDoorLeft,
          cbBottom,
          frontDoorLeft + doorDrawWidth,
          cbBottom,
          `VA: ${state.aberturaPorta} mm`,
          true,
          isHighResExport ? 68 : isCompact ? 28 : 36,
          isPortaMenor ? '#FFAB40' : '#EF4444',
          isHighResExport
            ? 'bold 17px ui-monospace, monospace'
            : 'bold 10px ui-monospace, monospace'
        );
      } else {
        drawDim(
          cbRight,
          sideDoorTop,
          cbRight,
          sideDoorTop + doorDrawWidth,
          `VA: ${state.aberturaPorta} mm`,
          false,
          isHighResExport ? 68 : isCompact ? 28 : 36,
          isPortaMenor ? '#FFAB40' : '#EF4444',
          isHighResExport
            ? 'bold 17px ui-monospace, monospace'
            : 'bold 10px ui-monospace, monospace'
        );
      }

      // Cabin Center Text
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#64FFDA';
      ctx.font = isHighResExport
        ? 'bold 20px system-ui, sans-serif'
        : 'bold 11px system-ui, sans-serif';
      ctx.fillText(
        'CABINE',
        cbCenterX,
        cbCenterY - (isHighResExport ? 30 : 18)
      );

      ctx.fillStyle = '#A7F3D0';
      ctx.font = isHighResExport
        ? 'bold 17px ui-monospace, monospace'
        : 'bold 9.5px ui-monospace, monospace';
      ctx.fillText(
        `${numeroPassageiros} PASS. | ${cargaUtilKg} kg`,
        cbCenterX,
        cbCenterY - (isHighResExport ? 8 : 4)
      );

      ctx.fillStyle = '#94A3B8';
      ctx.font = isHighResExport
        ? '14px ui-monospace, monospace'
        : '8px ui-monospace, monospace';
      ctx.fillText(
        `Área: ${areaCabineM2.toFixed(2)} m² (NBR 16858-1)`,
        cbCenterX,
        cbCenterY + (isHighResExport ? 15 : 9)
      );

      const driveLabelText = isElectric
        ? 'C.P. (CONTRAPESO)'
        : 'PISTÃO HIDRÁULICO';
      ctx.fillStyle = isElectric ? '#FFAB40' : '#00E5FF';
      ctx.font = isHighResExport
        ? 'bold 15px system-ui, sans-serif'
        : 'bold 9px system-ui, sans-serif';
      ctx.fillText(driveLabelText, driveCenterX, driveCenterY);
      ctx.restore();

      ctx.restore(); // Restore zoom scale

      // 9. Technical Title Block (Carimbo Arquitetônico)
      const tbWidth = isHighResExport ? 480 : isCompact ? 220 : 275;
      const tbHeight = isHighResExport ? 175 : isCompact ? 84 : 100;
      const tbLeft = width - tbWidth - (isHighResExport ? 30 : 14);
      const tbTop = height - tbHeight - (isHighResExport ? 30 : 14);

      ctx.fillStyle = 'rgba(10, 25, 47, 0.95)';
      ctx.fillRect(tbLeft, tbTop, tbWidth, tbHeight);

      ctx.strokeStyle = isPortaMenor ? '#64FFDA' : '#EF4444';
      ctx.lineWidth = isHighResExport ? 2.5 : 1.5;
      ctx.strokeRect(tbLeft, tbTop, tbWidth, tbHeight);

      ctx.fillStyle = '#64FFDA';
      ctx.font = isHighResExport
        ? 'bold 18px system-ui, sans-serif'
        : isCompact
        ? 'bold 9px system-ui, sans-serif'
        : 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        'PROJETO EXECUTIVO - PLANTA BAIXA',
        tbLeft + (isHighResExport ? 16 : 8),
        tbTop + (isHighResExport ? 26 : isCompact ? 13 : 15)
      );

      ctx.fillStyle = '#A7F3D0';
      ctx.font = isHighResExport
        ? 'bold 16px ui-monospace, monospace'
        : isCompact
        ? 'bold 8.5px ui-monospace, monospace'
        : 'bold 9.5px ui-monospace, monospace';
      ctx.fillText(
        `LOTAÇÃO: ${numeroPassageiros} PASS. | CARGA: ${cargaUtilKg} kg`,
        tbLeft + (isHighResExport ? 16 : 8),
        tbTop + (isHighResExport ? 52 : isCompact ? 26 : 30)
      );

      ctx.fillStyle = '#38BDF8';
      ctx.font = isHighResExport
        ? '15px ui-monospace, monospace'
        : isCompact
        ? '8px ui-monospace, monospace'
        : '9px ui-monospace, monospace';
      ctx.fillText(
        `NORMA: ABNT NBR 16858-1:2020`,
        tbLeft + (isHighResExport ? 16 : 8),
        tbTop + (isHighResExport ? 76 : isCompact ? 39 : 44)
      );

      ctx.fillStyle = '#E2E8F0';
      ctx.font = isHighResExport
        ? '14px ui-monospace, monospace'
        : isCompact
        ? '8px ui-monospace, monospace'
        : '9px ui-monospace, monospace';
      ctx.fillText(
        `${state.acionamento.toUpperCase()} | ARCADA: ${state.arcada.toUpperCase()}`,
        tbLeft + (isHighResExport ? 16 : 8),
        tbTop + (isHighResExport ? 100 : isCompact ? 52 : 58)
      );

      const montanteMm = Math.max(0, Math.round((ladoFaceMm - aberturaPorta) / 2));
      ctx.fillStyle = isPortaMenor ? '#FFAB40' : '#EF4444';
      ctx.fillText(
        `PORTA: ${state.tipoPorta} (${state.aberturaPorta} mm) | Face: ${ladoFaceMm} mm`,
        tbLeft + (isHighResExport ? 16 : 8),
        tbTop + (isHighResExport ? 124 : isCompact ? 64 : 72)
      );

      ctx.fillStyle = isPortaMenor ? '#6EE7B7' : '#F87171';
      ctx.fillText(
        `MONTANTES: 2x ${montanteMm} mm ${isPortaMenor ? '(✓ Conforme: Porta < Face)' : '(⚠️ NÃO CONFORME: Porta ≥ Face)'}`,
        tbLeft + (isHighResExport ? 16 : 8),
        tbTop + (isHighResExport ? 148 : isCompact ? 76 : 86)
      );

      // Warning alert banner on drawing if door is invalid (≥ face)
      if (!isPortaMenor) {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
        const warnW = isHighResExport ? 860 : isCompact ? 280 : 420;
        const warnH = isHighResExport ? 44 : isCompact ? 22 : 26;
        ctx.fillRect(
          isHighResExport ? 30 : 14,
          isHighResExport ? 125 : 74,
          warnW,
          warnH
        );
        ctx.fillStyle = '#FFFFFF';
        ctx.font = isHighResExport
          ? 'bold 18px system-ui, sans-serif'
          : isCompact
          ? 'bold 8px system-ui, sans-serif'
          : 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          `⚠️ ATENÇÃO: Abertura da porta (${state.aberturaPorta} mm) deve ser estritamente menor que a face da cabine (${ladoFaceMm} mm)!`,
          isHighResExport ? 42 : 20,
          isHighResExport ? 152 : isCompact ? 89 : 91
        );
      }

      // 10. Top Blueprint Title Header
      ctx.fillStyle = '#90CDF4';
      ctx.font = isHighResExport
        ? 'bold 24px system-ui, sans-serif'
        : isCompact
        ? 'bold 11px system-ui, sans-serif'
        : 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        'ESBOÇO TÉCNICO DO POÇO (PLANTA BAIXA)',
        isHighResExport ? 30 : 14,
        isHighResExport ? 40 : 22
      );

      ctx.fillStyle = 'rgba(144, 205, 244, 0.85)';
      ctx.font = isHighResExport
        ? '17px ui-monospace, monospace'
        : isCompact
        ? '8.5px ui-monospace, monospace'
        : '10px ui-monospace, monospace';
      ctx.fillText(
        `POÇO: ${larguraPoco} x ${profundidadePoco} mm | CABINE: ${state.larguraCabine} x ${state.profundidadeCabine} mm (${areaCabineM2.toFixed(
          2
        )} m²)`,
        isHighResExport ? 30 : 14,
        isHighResExport ? 68 : 36
      );

      ctx.fillStyle = '#34D399';
      ctx.font = isHighResExport
        ? 'bold 16px ui-monospace, monospace'
        : isCompact
        ? 'bold 8.5px ui-monospace, monospace'
        : 'bold 9.5px ui-monospace, monospace';
      ctx.fillText(
        `LOTAÇÃO: ${numeroPassageiros} PASSAGEIROS | CARGA ÚTIL: ${cargaUtilKg} kg (ABNT NBR 16858-1)`,
        isHighResExport ? 30 : 14,
        isHighResExport ? 94 : 50
      );
    },
    [state, results]
  );

  // On-screen redraw function with full resilience
  const drawBlueprint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = containerRef.current;
    if (!container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 280);
    // Subtract toolbar height approx 46px
    const height = Math.max(Math.floor(rect.height) - 46, 360);

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    try {
      renderBlueprintToContext(ctx, width, height, zoomLevel, false);
    } catch (e) {
      console.error('Error drawing elevator blueprint:', e);
    } finally {
      ctx.restore();
    }
  }, [renderBlueprintToContext, zoomLevel]);

  // Handle ResizeObserver & initial layout tick
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const triggerDraw = () => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(() => {
        drawBlueprint();
      });
    };

    // Draw immediately and after tick
    triggerDraw();
    const timer = setTimeout(triggerDraw, 60);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 50 && entry.contentRect.height > 50) {
          triggerDraw();
        }
      }
    });

    observer.observe(container);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [drawBlueprint, activeTab]);

  // Re-draw on window resize
  useEffect(() => {
    const handleResize = () => {
      drawBlueprint();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawBlueprint]);

  // High-resolution export generator (2400 x 1600 px)
  const generateHighResExport = useCallback((): Promise<{
    url: string;
    blob: Blob;
  }> => {
    return new Promise((resolve, reject) => {
      try {
        const offCanvas = document.createElement('canvas');
        const exportW = 2400;
        const exportH = 1600;
        offCanvas.width = exportW;
        offCanvas.height = exportH;

        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }

        renderBlueprintToContext(offCtx, exportW, exportH, 1, true);

        offCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao gerar imagem'));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve({ url, blob });
          },
          'image/png',
          1.0
        );
      } catch (err) {
        reject(err);
      }
    });
  }, [renderBlueprintToContext]);

  // Direct trigger to download blob to disk
  const triggerDownloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1200);
  };

  // User clicked Download: opens modal and attempts automatic download
  const handleDownloadClick = async () => {
    setIsGeneratingExport(true);
    setExportModalOpen(true);

    try {
      const { url, blob } = await generateHighResExport();
      setExportImageUrl(url);
      setExportBlob(blob);

      const filename = `planta-baixa-elevador-${results.larguraPoco}x${results.profundidadePoco}-nbr16858-1.png`;

      // Attempt automatic download
      try {
        triggerDownloadFile(blob, filename);
      } catch {
        // Automatic download may be blocked by iframe; modal allows manual save
      }
    } catch (err) {
      console.error('Erro na exportação:', err);
    } finally {
      setIsGeneratingExport(false);
    }
  };

  const handleCopyImage = async () => {
    if (!exportBlob) return;
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.write === 'function'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': exportBlob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
      }
    } catch {
      // Clipboard write might not be supported in all browsers
    }
  };

  const handlePrint = () => {
    if (!exportImageUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Planta Baixa - Elevador ${results.larguraPoco}x${results.profundidadePoco} mm</title>
          <style>
            body { margin: 0; padding: 20px; background: #081426; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
            @media print {
              body { background: white; padding: 0; }
              img { width: 100%; }
            }
          </style>
        </head>
        <body>
          <img src="${exportImageUrl}" onload="window.print();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div
        ref={containerRef}
        id="blueprint-container"
        className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all ${
          isFullscreen
            ? 'fixed inset-2 sm:inset-4 z-50 rounded-2xl'
            : 'w-full h-full min-h-[500px]'
        }`}
      >
        {/* Top action toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur z-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-cyan-300 tracking-wide truncate">
              CAD VETORIAL EM TEMPO REAL
            </span>
            <span className="hidden md:inline text-[11px] text-slate-400 font-mono">
              (ABNT NBR 16858-1)
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              id="btn-zoom-in"
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.2))}
              title="Aproximar Zoom"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              id="btn-zoom-out"
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
              title="Afastar Zoom"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              id="btn-zoom-reset"
              type="button"
              onClick={() => setZoomLevel(1)}
              title="Redefinir Zoom"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            {/* Prominent PDF Report Button */}
            <button
              id="btn-download-pdf-blueprint"
              type="button"
              onClick={handleDownloadPdfClick}
              disabled={isGeneratingPdf}
              title="Gerar e Baixar Relatório Técnico Completo em PDF (NBR 16858-1)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Gerar PDF</span>
                </>
              )}
            </button>

            {/* Prominent Download Image Button */}
            <button
              id="btn-download-blueprint"
              type="button"
              onClick={handleDownloadClick}
              title="Baixar Desenho Técnico em Alta Resolução (PNG)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar Desenho</span>
            </button>

            <button
              id="btn-toggle-fullscreen"
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Interactive Blueprint Canvas */}
        <div className="relative flex-1 w-full h-full min-h-[440px] bg-[#081426] flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            id="elevator-blueprint-canvas"
            className="w-full h-full block cursor-crosshair touch-none"
          />

          {/* Legend pills at bottom-left */}
          <div className="absolute bottom-3 left-3 hidden md:flex items-center gap-2 bg-slate-950/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono pointer-events-none">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
              <span>Cabine</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              <span>Porta</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`w-2.5 h-2.5 rounded-sm ${
                  state.acionamento === 'Elétrico'
                    ? 'bg-amber-500'
                    : 'bg-cyan-400'
                } inline-block`}
              />
              <span>
                {state.acionamento === 'Elétrico' ? 'Contrapeso' : 'Pistão'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-300 inline-block" />
              <span>Paredes Poço</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export / Download Modal (solves sandbox iframe download blocks & mobile downloads) */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileImage className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Planta Baixa Técnica de Engenharia
                  </h3>
                  <p className="text-xs text-slate-400">
                    Resolução Ultra-HD (2400 × 1600 px) • Norma ABNT NBR
                    16858-1:2020
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Image Preview */}
            <div className="p-5 bg-slate-950/60 flex flex-col items-center justify-center min-h-[300px]">
              {isGeneratingExport ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-slate-300">
                    Gerando desenho técnico em alta resolução...
                  </span>
                </div>
              ) : exportImageUrl ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="relative w-full max-h-[460px] overflow-auto rounded-xl border border-slate-800 bg-[#081426] flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={exportImageUrl}
                      alt="Planta Baixa do Elevador"
                      className="max-w-full max-h-[440px] object-contain rounded shadow-lg"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    💡 Dica: Se o download não iniciar automaticamente, você
                    pode clicar com o botão direito na imagem acima (ou segurar
                    no celular) e selecionar{' '}
                    <strong className="text-slate-200">
                      &quot;Salvar imagem como...&quot;
                    </strong>
                    .
                  </p>
                </div>
              ) : (
                <span className="text-sm text-rose-400">
                  Falha ao gerar o desenho. Tente novamente.
                </span>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>
                  Poço: {results.larguraPoco}x{results.profundidadePoco} mm
                </span>
                <span>•</span>
                <span>
                  {results.numeroPassageiros} Pass. ({results.cargaUtilKg} kg)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {exportBlob && (
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedImage ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copiar Imagem</span>
                      </>
                    )}
                  </button>
                )}

                {exportImageUrl && (
                  <a
                    href={exportImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>Abrir em Nova Aba</span>
                  </a>
                )}

                {exportBlob && (
                  <button
                    type="button"
                    onClick={() => {
                      const filename = `planta-baixa-elevador-${results.larguraPoco}x${results.profundidadePoco}-nbr16858-1.png`;
                      triggerDownloadFile(exportBlob, filename);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Imagem PNG</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadPdfClick}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Baixar Relatório em PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
