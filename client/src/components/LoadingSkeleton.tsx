import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

interface LoadingSkeletonProps {
  rows?: number;
  rowsCount?: number;
}

export default function LoadingSkeleton({ rows = 8, rowsCount = 4 }: LoadingSkeletonProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" width="100%" height={52} />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rounded" width="100%" height={36} />
        ))}
        <Skeleton variant="rounded" width={`${rowsCount * 12}%`} height={28} />
      </Stack>
    </Box>
  );
}
