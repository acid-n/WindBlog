interface ArchiveMonthPageProps {
  params: { year: string; month: string };
}

const ArchiveMonthPage = async ({ params }: ArchiveMonthPageProps) => {
  return <div>Test minimal ArchiveMonthPage: {params.year}-{params.month}</div>;
};

export default ArchiveMonthPage;