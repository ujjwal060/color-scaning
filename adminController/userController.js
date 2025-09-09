import userModels from "../models/userModels.js";

const getAllUsers = async (req, res) => {
    try {
        const { offset, limit, filter } = req.body;
        const parsedOffset = parseInt(offset);
        const parsedLimit = parseInt(limit);
        let aggregation = [];
        if (filter.name) {
            aggregation.push({
                $match: {
                    name: { $regex: filter.name, $options: 'i' }
                }
            });
        }
        if (filter.email) {
            aggregation.push({
                $match: {
                    email: { $regex: filter.email, $options: 'i' }
                }
            });
        }
        if (filter.phoneNo) {
            aggregation.push({
                $match: {
                    phoneNo: { $regex: filter.phoneNo, $options: 'i' }
                }
            });
        }

        aggregation.push({
            $facet: {
                data: [
                    { $skip: parsedOffset },
                    { $limit: parsedLimit },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phoneNo: 1,
                            createdAt: 1
                        }
                    }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        });

        const users = await userModels.aggregate(aggregation);

        const totalCount = users[0]?.totalCount[0]?.count || 0;
        res.status(200).json({
            status: 200,
            message: "Users fetched successfully",
            data: users[0]?.data || [],
            totalCount
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }

}

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        await userModels.findByIdAndDelete(userId);
        res.status(200).json({
            status: 200,
            message: "User deleted successfully"
        });
    } catch (err) {
        res.status(500).json({ status: 500, message: err.message });
    }
}

export {
    getAllUsers,
    deleteUser
}