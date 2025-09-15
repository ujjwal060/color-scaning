import userModels from "../../models/userModels.js";

const getAllUsers = async (req, res) => {
  try {
    const { offset, limit, sortOrder } = req.body;
    const parsedOffset = parseInt(offset) || 0;
    const parsedLimit = parseInt(limit) || 10;
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const aggregation = [
      {
        $facet: {
          data: [
            { $sort: { createdAt: sortDirection } },
            { $skip: parsedOffset },
            { $limit: parsedLimit },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phoneNo: 1,
                createdAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const users = await userModels.aggregate(aggregation);

    const totalCount = users[0]?.totalCount[0]?.count || 0;

    res.status(200).json({
      status: 200,
      message: "Users fetched successfully",
      data: users[0]?.data || [],
      totalCount,
      offset: parsedOffset,
      limit: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit),
      currentPage: Math.floor(parsedOffset / parsedLimit) + 1,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await userModels.findByIdAndDelete(userId);
    res.status(200).json({
      status: 200,
      message: "User deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: err.message });
  }
};

export { getAllUsers, deleteUser };
